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
from sqlalchemy import func
from datetime import timedelta
from config import Config
from models import db, User, InterviewSession, Question, Response, Feedback, Violation
from agents.interviewer import get_interviewer_response
from agents.evaluator import evaluate_interview
from utils.resume_parser import process_resume, get_resume_context, collection

app = Flask(__name__)
app.config.from_object(Config)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')

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

def admin_required(f):
    @wraps(f)
    @token_required
    def decorated(current_user, *args, **kwargs):
        if current_user.role != 'admin':
            return jsonify({"error": "Admin access required"}), 403
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
# AUTHENTICATION ROUTES
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
        new_user = User(name=user_data['name'], email=email, password_hash=generate_password_hash(user_data['password'], method='pbkdf2:sha256'), role='candidate', status='active')
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
    if not user: return jsonify({"error": "User not found"}), 404
    if user.status == 'blocked': return jsonify({"error": "This account has been blocked by an administrator."}), 403
    if not check_password_hash(user.password_hash, password): return jsonify({"error": "Invalid password"}), 401

    otp = str(random.randint(100000, 999999))
    otp_store[email] = {'otp': otp, 'password': password, 'type': 'login'}
    email_sent = send_email("Your Login OTP", email, f"Your OTP for login is: {otp}.")
    if email_sent: return jsonify({"status": "success", "message": "OTP sent to email!"})
    else:
        print(f"⚠️ Email server failed. [DEV MODE] Login OTP for {email} is: {otp}")
        return jsonify({"status": "success", "message": f"Email failed, but [DEV MODE] OTP is: {otp}"})

@app.route('/api/verify-login-otp', methods=['POST'])
def verify_login_otp():
    data = request.get_json()
    email, otp = data.get('email', '').strip().lower(), data.get('otp', '')
    if email in otp_store and otp_store[email]['otp'] == otp and otp_store[email].get('type') == 'login':
        user = User.query.filter_by(email=email).first()
        if user:
            token = jwt.encode({'user_id': user.user_id, 'email': user.email, 'role': user.role, 'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
            del otp_store[email]
            return jsonify({"status": "success", "token": token, "user": {"user_id": user.user_id, "name": user.name, "email": user.email, "role": user.role}})
    return jsonify({"error": "Invalid OTP or session expired"}), 401

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
        email_sent = send_email("Your Password Reset OTP", email, f"Your OTP for password reset is: {otp}.")
        if email_sent: return jsonify({"status": "success", "message": "OTP sent to email!"})
        else:
            print(f"⚠️ Email server failed. [DEV MODE] Forgot Password OTP for {email} is: {otp}")
            return jsonify({"status": "success", "message": f"Email failed, but [DEV MODE] OTP is: {otp}"})
    except Exception as e: return jsonify({"error": str(e)}), 500

@app.route('/api/forgot-password-verify', methods=['POST'])
def forgot_password_verify():
    try:
        data = request.get_json()
        email, otp, new_password = data.get('email', '').strip().lower(), data.get('otp', ''), data.get('new_password', '')
        if not new_password or len(new_password) < 6: return jsonify({"error": "Password must be at least 6 characters"}), 400
        if email in otp_store and otp_store[email]['otp'] == otp and otp_store[email].get('type') == 'forgot':
            user = User.query.filter_by(email=email).first()
            if user:
                user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
                db.session.commit(); del otp_store[email]
                return jsonify({"status": "success", "message": "Password updated successfully! You can now login."})
        return jsonify({"error": "Invalid OTP or session expired"}), 401
    except Exception as e: return jsonify({"error": str(e)}), 500

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
@token_required
def get_interviews(current_user):
    sessions = InterviewSession.query.filter_by(user_id=current_user.user_id).all()
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

@app.route('/api/interview/<int:session_id>', methods=['DELETE'])
@token_required
def delete_interview(current_user, session_id):
    session = InterviewSession.query.filter_by(session_id=session_id, user_id=current_user.user_id).first()
    if not session: return jsonify({"error": "Session not found"}), 404
    Response.query.filter(Response.question_id.in_(db.session.query(Question.question_id).filter_by(session_id=session_id))).delete(synchronize_session='fetch')
    Question.query.filter_by(session_id=session_id).delete()
    Feedback.query.filter_by(session_id=session_id).delete()
    db.session.delete(session); db.session.commit()
    return jsonify({"status": "success", "message": "Interview deleted successfully!"})

@app.route('/api/user/stats', methods=['GET'])
@token_required
def get_user_stats(current_user):
    try:
        sessions = InterviewSession.query.filter_by(user_id=current_user.user_id, status='completed').order_by(InterviewSession.started_at.asc()).all()
        interview_history = []
        total_tech = 0; total_behav = 0; count = 0
        for session in sessions:
            feedback = Feedback.query.filter_by(session_id=session.session_id).first()
            if feedback:
                total_tech += feedback.technical_score; total_behav += feedback.behavioral_score; count += 1
                interview_history.append({
                    "session_id": session.session_id,
                    "interview_number": count, 
                    "date": session.started_at.strftime("%d %b %Y, %I:%M %p"), 
                    "job_role": session.job_role, 
                    "technical_score": feedback.technical_score, 
                    "behavioral_score": feedback.behavioral_score, 
                    "average_score": round((feedback.technical_score + feedback.behavioral_score) / 2, 1)
                })
        return jsonify({
            "status": "success", 
            "total_interviews": count, 
            "average_technical_score": round(total_tech / count, 1) if count > 0 else 0, 
            "average_behavioral_score": round(total_behav / count, 1) if count > 0 else 0, 
            "interview_history": interview_history
        })
    except Exception as e: return jsonify({"error": str(e)}), 500

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
        session.status = 'completed'; db.session.commit()

        user = current_user
        send_email("Your AI Interview Feedback is Ready!", user.email, f"Hi {user.name},\n\nYour interview for {session.job_role} is complete!\n\nTechnical Score: {feedback.technical_score}/10\nBehavioral Score: {feedback.behavioral_score}/10\n\nStrengths: {feedback.strengths}\n\nPlease log in to view your full report.")
        return jsonify({"status": "success", "feedback": feedback_data})
    except Exception as e: return jsonify({"error": str(e)}), 500

# ==============================================================================
# ADMIN ROUTES (Protected)
# ==============================================================================
@app.route('/api/admin/metrics', methods=['GET'])
@admin_required
def get_admin_metrics(current_user):
    total_candidates = User.query.filter_by(role='candidate').count()
    total_interviews = InterviewSession.query.count()
    
    feedbacks = Feedback.query.all()
    avg_tech = round(sum(f.technical_score for f in feedbacks) / len(feedbacks), 1) if feedbacks else 0
    avg_behav = round(sum(f.behavioral_score for f in feedbacks) / len(feedbacks), 1) if feedbacks else 0
    
    thirty_days_ago = datetime.datetime.now(datetime.timezone.utc) - timedelta(days=30)
    recent_sessions = InterviewSession.query.filter(InterviewSession.started_at >= thirty_days_ago).all()
    
    volume_data = {}
    for session in recent_sessions:
        date_str = session.started_at.strftime('%m-%d')
        volume_data[date_str] = volume_data.get(date_str, 0) + 1
    
    chart_volume = []
    for i in range(30, -1, -1):
        day = (datetime.datetime.now(datetime.timezone.utc) - timedelta(days=i))
        day_str = day.strftime('%m-%d')
        chart_volume.append({"date": day_str, "count": volume_data.get(day_str, 0)})

    roles = db.session.query(InterviewSession.job_role, func.count(InterviewSession.session_id)).group_by(InterviewSession.job_role).all()
    chart_roles = [{"name": role, "value": count} for role, count in roles if role]

    return jsonify({
        "status": "success",
        "data": {
            "total_candidates": total_candidates,
            "total_interviews": total_interviews,
            "avg_tech_score": avg_tech,
            "avg_behav_score": avg_behav,
            "volume_chart": chart_volume,
            "role_chart": chart_roles
        }
    })

@app.route('/api/admin/interviews', methods=['GET'])
@admin_required
def get_all_interviews(current_user):
    try:
        sessions = InterviewSession.query.order_by(InterviewSession.started_at.desc()).all()
        result = []
        for session in sessions:
            user = User.query.get(session.user_id)
            feedback = Feedback.query.filter_by(session_id=session.session_id).first()
            question_count = Question.query.filter_by(session_id=session.session_id).count()
            
            raw_time = session.started_at
            if raw_time:
                if raw_time.tzinfo is None: raw_time = raw_time.replace(tzinfo=datetime.timezone.utc)
                date_str = raw_time.astimezone(IST).strftime("%d %b %Y, %I:%M %p")
            else: date_str = "Unknown Date"
            
            result.append({
                "session_id": session.session_id,
                "candidate_name": user.name if user else "Unknown",
                "candidate_email": user.email if user else "Unknown",
                "job_role": session.job_role,
                "status": session.status,
                "started_at": date_str,
                "questions_count": question_count,
                "technical_score": feedback.technical_score if feedback else None,
                "behavioral_score": feedback.behavioral_score if feedback else None,
                "strengths": feedback.strengths if feedback else None,
                "weaknesses": feedback.weaknesses if feedback else None
            })
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/interviews/<int:session_id>/override-score', methods=['POST'])
@admin_required
def override_score(current_user, session_id):
    try:
        data = request.get_json()
        new_tech = data.get('technical_score')
        new_behav = data.get('behavioral_score')
        reason = data.get('reason', 'Manual override by admin')
        
        feedback = Feedback.query.filter_by(session_id=session_id).first()
        if not feedback:
            return jsonify({"error": "Feedback not found"}), 404
        
        if new_tech is not None: feedback.technical_score = int(new_tech)
        if new_behav is not None: feedback.behavioral_score = int(new_behav)
        
        db.session.commit()
        return jsonify({"status": "success", "message": f"Scores overridden. Reason: {reason}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================================================================
# PROCTORING ROUTES (NEW)
# ==============================================================================
@app.route('/api/admin/proctoring', methods=['GET'])
@admin_required
def get_proctoring_logs(current_user):
    try:
        users = User.query.filter_by(role='candidate').all()
        report = []
        
        for user in users:
            sessions = InterviewSession.query.filter_by(user_id=user.user_id).all()
            for session in sessions:
                report.append({
                    "user_id": user.user_id,
                    "candidate_name": user.name,
                    "candidate_email": user.email,
                    "session_id": session.session_id,
                    "job_role": session.job_role,
                    "status": session.status,
                    "started_at": session.started_at.strftime("%d %b %Y, %I:%M %p") if session.started_at else "Unknown"
                })
        
        return jsonify({"status": "success", "data": report})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/proctoring/<int:session_id>/flag', methods=['POST'])
@admin_required
def flag_violation(current_user, session_id):
    try:
        data = request.get_json()
        violation_type = data.get('type', 'Manual Flag')
        description = data.get('description', 'Flagged by admin')
        
        session = InterviewSession.query.get(session_id)
        if not session: return jsonify({"error": "Session not found"}), 404
        
        # Log the violation into the database
        new_violation = Violation(
            user_id=session.user_id,
            session_id=session_id,
            violation_type=violation_type,
            description=description
        )
        db.session.add(new_violation)
        db.session.commit()
        
        return jsonify({"status": "success", "message": f"Session {session_id} flagged for {violation_type}"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    users = User.query.all()
    user_list = [{"user_id": u.user_id, "name": u.name, "email": u.email, "role": u.role, "status": u.status, "interviews_count": InterviewSession.query.filter_by(user_id=u.user_id).count()} for u in users]
    return jsonify({"status": "success", "data": user_list})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    InterviewSession.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"status": "success", "message": "User deleted successfully"})

@app.route('/api/admin/users/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def reset_user_password(current_user, user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    temp_password = "TempPass123!"
    user.password_hash = generate_password_hash(temp_password, method='pbkdf2:sha256')
    db.session.commit()
    send_email("Password Reset by Admin", user.email, f"Hello {user.name},\n\nYour password has been reset by the system administrator.\nYour temporary password is: {temp_password}\n\nPlease log in and change it immediately.")
    return jsonify({"status": "success", "message": f"Password reset successfully. Temp password: {temp_password}"})

@app.route('/api/admin/users/<int:user_id>/toggle-block', methods=['POST'])
@admin_required
def toggle_block_user(current_user, user_id):
    user = User.query.get(user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    user.status = 'blocked' if user.status == 'active' else 'active'
    db.session.commit()
    return jsonify({"status": "success", "message": f"User status changed to {user.status}"})

@app.route('/api/dev/promote-to-admin', methods=['POST'])
def promote_to_admin():
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    user = User.query.filter_by(email=email).first()
    if user:
        user.role = 'admin'
        db.session.commit()
        return jsonify({"status": "success", "message": f"{email} is now an admin!"})
    return jsonify({"error": "User not found"}), 404

# ==============================================================================
# PROFILE SETTINGS ROUTES
# ==============================================================================
@app.route('/api/update-profile', methods=['POST'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    new_name = data.get('name', '').strip()
    if not new_name:
        return jsonify({"error": "Name cannot be empty"}), 400
    current_user.name = new_name
    db.session.commit()
    return jsonify({"status": "success", "message": "Profile updated successfully!"})

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')
    
    if not check_password_hash(current_user.password_hash, current_pw):
        return jsonify({"error": "Current password is incorrect"}), 401
    if len(new_pw) < 6:
        return jsonify({"error": "New password must be at least 6 characters"}), 400
        
    current_user.password_hash = generate_password_hash(new_pw, method='pbkdf2:sha256')
    db.session.commit()
    return jsonify({"status": "success", "message": "Password changed successfully!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)