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

# --- IST TIMEZONE DEFINITION ---
IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))

mail = Mail(app)
CORS(app)
db.init_app(app)

with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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

def send_email(subject, recipient, body):
    try:
        msg = Message(subject, sender=app.config['MAIL_USERNAME'], recipients=[recipient])
        msg.body = body
        mail.send(msg)
        return True
    except Exception as e:
        print(f"Email Error: {e}")
        return False

# ==============================================================================
# AUTHENTICATION ROUTES (2-STEP VERIFICATION)
# ==============================================================================
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email', '')
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already registered"}), 400
    otp = str(random.randint(100000, 999999))
    otp_store[email] = {'otp': otp, 'data': data, 'type': 'signup'}
    send_email("Your Interview App OTP", email, f"Your OTP for signup is: {otp}. It expires in 5 minutes.")
    return jsonify({"status": "success", "message": "OTP sent to email!"})

@app.route('/api/verify-signup-otp', methods=['POST'])
def verify_signup_otp():
    data = request.get_json()
    email, otp = data.get('email', ''), data.get('otp', '')
    if email in otp_store and otp_store[email]['otp'] == otp and otp_store[email].get('type') == 'signup':
        user_data = otp_store[email]['data']
        new_user = User(name=user_data['name'], email=email, password_hash=generate_password_hash(user_data['password'], method='pbkdf2:sha256'), role='candidate')
        db.session.add(new_user); db.session.commit()
        del otp_store[email]
        return jsonify({"status": "success", "message": "Signup successful!"}), 201
    return jsonify({"error": "Invalid or expired OTP"}), 400

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    
    user = User.query.filter_by(email=email).first()
    if not user: 
        return jsonify({"error": "User not found"}), 404
        
    if not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid password"}), 401

    otp = str(random.randint(100000, 999999))
    # SECURE: Tag this OTP specifically for 'login'
    otp_store[email] = {'otp': otp, 'password': password, 'type': 'login'}
    
    email_sent = send_email("Your Login OTP", email, f"Your OTP for login is: {otp}.")
    if email_sent:
        return jsonify({"status": "success", "message": "OTP sent to email!"})
    else:
        print(f"⚠️ Email server failed. [DEV MODE] Login OTP for {email} is: {otp}")
        return jsonify({"status": "success", "message": f"Email failed, but [DEV MODE] OTP is: {otp}"})

@app.route('/api/verify-login-otp', methods=['POST'])
def verify_login_otp():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    otp = data.get('otp', '')
    
    # SECURE: Check if OTP exists, matches, and is specifically for 'login'
    if email in otp_store and otp_store[email]['otp'] == otp and otp_store[email].get('type') == 'login':
        user = User.query.filter_by(email=email).first()
        if user:
            token = jwt.encode({
                'user_id': user.user_id, 
                'email': user.email, 
                'role': user.role, 
                'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
            }, app.config['SECRET_KEY'], algorithm='HS256')
            del otp_store[email]
            return jsonify({
                "status": "success", 
                "token": token, 
                "user": {"user_id": user.user_id, "name": user.name, "email": user.email}
            })
    return jsonify({"error": "Invalid OTP or session expired"}), 401

# ==============================================================================
# FORGOT PASSWORD ROUTES
# ==============================================================================
@app.route('/api/forgot-password-request', methods=['POST'])
def forgot_password_request():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email: return jsonify({"error": "Email is required"}), 400
        user = User.query.filter_by(email=email).first()
        if not user: return jsonify({"error": "User not found with this email"}), 404
            
        otp = str(random.randint(100000, 999999))
        otp_store[email] = {'otp': otp, 'type': 'forgot'}
        
        email_sent = send_email("Your Password Reset OTP", email, f"Your OTP for password reset is: {otp}. It expires in 5 minutes.")
        if email_sent:
            return jsonify({"status": "success", "message": "OTP sent to email!"})
        else:
            print(f"⚠️ Email server failed. [DEV MODE] Forgot Password OTP for {email} is: {otp}")
            return jsonify({"status": "success", "message": f"Email failed, but [DEV MODE] OTP is: {otp}"})
    except Exception as e:
        print(f"Forgot Password Request Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/api/forgot-password-verify', methods=['POST'])
def forgot_password_verify():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '')
        new_password = data.get('new_password', '')
        
        if not new_password or len(new_password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
            
        if email in otp_store and otp_store[email]['otp'] == otp and otp_store[email].get('type') == 'forgot':
            user = User.query.filter_by(email=email).first()
            if user:
                user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
                db.session.commit()
                del otp_store[email]
                return jsonify({"status": "success", "message": "Password updated successfully! You can now login."})
                
        return jsonify({"error": "Invalid OTP or session expired"}), 401
    except Exception as e:
        print(f"Forgot Password Verify Error: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

# ==============================================================================
# RESUME & INTERVIEW ROUTES
# ==============================================================================
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

@app.route('/api/interview/active', methods=['GET'])
@token_required
def get_active_interview(current_user):
    active_session = InterviewSession.query.filter_by(user_id=current_user.user_id, status='in_progress').order_by(InterviewSession.started_at.desc()).first()
    if not active_session: return jsonify({"status": "success", "active": False})
    
    questions = Question.query.filter_by(session_id=active_session.session_id).order_by(Question.question_id).all()
    qa_pairs = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else ""} for q in questions]
    
    q_count = len(questions)
    current_round = 1
    if q_count >= 5: current_round = 2
    if q_count >= 10: current_round = 3
    
    return jsonify({"status": "success", "active": True, "session_id": active_session.session_id, "job_role": active_session.job_role, "current_round": current_round, "qa_pairs": qa_pairs})

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
        active_session = InterviewSession(user_id=current_user.user_id, job_role=job_role, status='in_progress', started_at=datetime.datetime.now(datetime.timezone.utc))
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
        raw_time = session.started_at
        if raw_time:
            if raw_time.tzinfo is None: raw_time = raw_time.replace(tzinfo=datetime.timezone.utc)
            date_str = raw_time.astimezone(IST).strftime("%d %b %Y, %I:%M %p")
        else: date_str = "Unknown Date"
            
        result.append({"session_id": session.session_id, "job_role": session.job_role, "status": session.status, "started_at": date_str, "technical_score": feedback.technical_score if feedback else None, "behavioral_score": feedback.behavioral_score if feedback else None})
    result.reverse()
    return jsonify({"status": "success", "data": result})

@app.route('/api/evaluate/<int:session_id>', methods=['POST'])
@token_required
def evaluate_session(current_user, session_id):
    try:
        session = InterviewSession.query.get(session_id)
        if not session: return jsonify({"error": "Session not found"}), 404
            
        questions = Question.query.filter_by(session_id=session_id).all()
        qa_pairs = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else "No answer"} for q in questions]
        if not qa_pairs: return jsonify({"error": "No questions found"}), 400

        resume_context = get_resume_context(current_user.user_id)
        feedback_data = evaluate_interview(qa_pairs, session.job_role, resume_context)
        
        feedback = Feedback.query.filter_by(session_id=session_id).first()
        if not feedback:
            feedback = Feedback(session_id=session_id, user_id=current_user.user_id)
            db.session.add(feedback)
            
        feedback.technical_score = int(feedback_data.get("technical_score", 5))
        feedback.behavioral_score = int(feedback_data.get("behavioral_score", 5))
        feedback.strengths = str(feedback_data.get("strengths", ""))
        feedback.weaknesses = str(feedback_data.get("weaknesses", ""))
        feedback.career_recommendations = str(feedback_data.get("career_recommendations", ""))
        
        session.status = 'completed'
        db.session.commit()

        user = current_user
        email_body = f"Hi {user.name},\n\nYour interview for {session.job_role} is complete!\n\nTechnical Score: {feedback.technical_score}/10\nBehavioral Score: {feedback.behavioral_score}/10\n\nStrengths: {feedback.strengths}\n\nPlease log in to view your full report."
        send_email("Your AI Interview Feedback is Ready!", user.email, email_body)

        return jsonify({"status": "success", "feedback": feedback_data})
    except Exception as e:
        print(f"Evaluation Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)