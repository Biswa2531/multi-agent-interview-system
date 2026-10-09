import os
import jwt
import datetime
import random
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_mail import Mail, Message
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from config import Config
from models import db, User, InterviewSession, Question, Response, Feedback
from agents.interviewer import get_interviewer_response
from agents.evaluator import evaluate_interview
from utils.resume_parser import process_resume, get_resume_context, collection

app = Flask(__name__)
app.config.from_object(Config)

# --- EMAIL CONFIGURATION ---
app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

mail = Mail(app)
CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Temporary storage for OTPs (In production, use Redis or a DB table)
otp_store = {} 

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token: return jsonify({"error": "Token missing"}), 401
        try:
            token = token.split(" ")[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, data['user_id'])
            if not current_user: return jsonify({"error": "User not found"}), 401
        except: return jsonify({"error": "Invalid token"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- HELPER: Send Email ---
def send_email(subject, recipient, body):
    try:
        msg = Message(subject, sender=app.config['MAIL_USERNAME'], recipients=[recipient])
        msg.body = body
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

# --- AUTH ROUTES WITH OTP ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email', '')
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {'otp': otp, 'data': data}
    
    send_email("Your Interview App OTP", email, f"Your OTP for signup is: {otp}. It expires in 5 minutes.")
    return jsonify({"status": "success", "message": "OTP sent to email!"})

@app.route('/api/verify-signup-otp', methods=['POST'])
def verify_signup_otp():
    data = request.get_json()
    email, otp = data.get('email', ''), data.get('otp', '')
    
    if email in otp_store and otp_store[email]['otp'] == otp:
        user_data = otp_store[email]['data']
        new_user = User(name=user_data['name'], email=email, password_hash=generate_password_hash(user_data['password'], method='pbkdf2:sha256'), role='candidate')
        db.session.add(new_user); db.session.commit()
        del otp_store[email]
        return jsonify({"status": "success", "message": "Signup successful!"}), 201
    return jsonify({"error": "Invalid or expired OTP"}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    user = User.query.filter_by(email=email).first()
    if not user: return jsonify({"error": "User not found"}), 404
    
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {'otp': otp, 'password': data.get('password', '')}
    send_email("Your Login OTP", email, f"Your OTP for login is: {otp}.")
    return jsonify({"status": "success", "message": "OTP sent to email!"})

@app.route('/api/verify-login-otp', methods=['POST'])
def verify_login_otp():
    data = request.get_json()
    email, otp = data.get('email', ''), data.get('otp', '')
    
    if email in otp_store and otp_store[email]['otp'] == otp:
        user = User.query.filter_by(email=email).first()
        if check_password_hash(user.password_hash, otp_store[email]['password']):
            token = jwt.encode({'user_id': user.user_id, 'email': user.email, 'role': user.role, 'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
            del otp_store[email]
            return jsonify({"status": "success", "token": token, "user": {"user_id": user.user_id, "name": user.name, "email": user.email}})
    return jsonify({"error": "Invalid OTP or Password"}), 401

# --- INTERVIEW ROUTES ---
@app.route('/api/upload-resume', methods=['POST'])
@token_required
def upload_resume(current_user):
    if 'file' not in request.files: return jsonify({"error": "No file"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No file"}), 400
    filename = secure_filename(file.filename)
    file.save(os.path.join(UPLOAD_FOLDER, filename))
    result = process_resume(os.path.join(UPLOAD_FOLDER, filename), current_user.user_id)
    return jsonify({"status": "success", "message": result})

@app.route('/api/clear-resume', methods=['POST'])
@token_required
def clear_resume(current_user):
    try:
        collection.delete(where={"user_id": str(current_user.user_id)})
        return jsonify({"status": "success", "message": "Resume cleared!"})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/interview', methods=['POST'])
@token_required
def interview_chat(current_user):
    data = request.get_json()
    user_message, job_role, chat_history = data.get('message', ''), data.get('job_role', 'Software Engineer'), data.get('chat_history', [])
    current_round = data.get('current_round', 1)

    active_session = InterviewSession.query.filter_by(user_id=current_user.user_id, status='in_progress').order_by(InterviewSession.started_at.desc()).first()
    if active_session and Question.query.filter_by(session_id=active_session.session_id).count() >= 15:
        active_session.status = 'completed'; db.session.commit(); active_session = None
    if not active_session:
        active_session = InterviewSession(user_id=current_user.user_id, job_role=job_role, status='in_progress')
        db.session.add(active_session); db.session.commit()

    if Question.query.filter_by(session_id=active_session.session_id).count() >= 15:
        return jsonify({"status": "success", "response": "Interview completed.", "is_complete": True})

    resume_context = get_resume_context(current_user.user_id)
    ai_response = get_interviewer_response(user_message, job_role, chat_history, resume_context, current_round)

    new_q = Question(session_id=active_session.session_id, question_text=ai_response, category='Technical', difficulty='Medium')
    db.session.add(new_q); db.session.commit()
    db.session.add(Response(question_id=new_q.question_id, user_id=current_user.user_id, answer_text=user_message))
    db.session.commit()
    return jsonify({"status": "success", "response": ai_response, "is_complete": False})

@app.route('/api/interviews', methods=['GET'])
def get_interviews():
    sessions = InterviewSession.query.all()
    result = []
    for session in sessions:
        feedback = Feedback.query.filter_by(session_id=session.session_id).first()
        result.append({
            "session_id": session.session_id, "job_role": session.job_role, "status": session.status,
            "started_at": session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            "technical_score": feedback.technical_score if feedback else None,
            "behavioral_score": feedback.behavioral_score if feedback else None
        })
    result.reverse()
    return jsonify({"status": "success", "data": result})

@app.route('/api/evaluate/<int:session_id>', methods=['POST'])
def evaluate_session(session_id):
    try:
        session = InterviewSession.query.get(session_id)
        if not session: return jsonify({"error": "Not found"}), 404
        questions = Question.query.filter_by(session_id=session_id).all()
        qa_pairs = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else "No answer"} for q in questions]
        
        feedback_data = evaluate_interview(qa_pairs, session.job_role)
        
        db.session.add(Feedback(
            session_id=session_id, user_id=session.user_id,
            technical_score=int(feedback_data.get("technical_score", 5)),
            behavioral_score=int(feedback_data.get("behavioral_score", 5)),
            strengths=str(feedback_data.get("strengths", "")),
            weaknesses=str(feedback_data.get("weaknesses", "")),
            career_recommendations=str(feedback_data.get("career_recommendations", ""))
        ))
        session.status = 'completed'; db.session.commit()

        # --- SEND FEEDBACK EMAIL ---
        user = db.session.get(User, session.user_id)
        if user:
            email_body = f"Hi {user.name},\n\nYour interview for {session.job_role} is complete!\n\nTechnical Score: {feedback_data.get('technical_score')}/10\nBehavioral Score: {feedback_data.get('behavioral_score')}/10\n\nStrengths: {feedback_data.get('strengths')}\n\nPlease log in to your dashboard to view the full report."
            send_email("Your AI Interview Feedback is Ready!", user.email, email_body)

        return jsonify({"status": "success", "feedback": feedback_data})
    except Exception as e: return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)