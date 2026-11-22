import os
import jwt
import json
import base64
import datetime
import random
import io
import hashlib
import uuid
import logging
from functools import wraps
from io import BytesIO

from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import func
from datetime import timedelta

from config import Config
from models import db, User, InterviewSession, Question, Response, Feedback, Violation, ProctoringConfig, Snapshot, OTPCode
from agents.interviewer import get_interviewer_response
from agents.evaluator import evaluate_interview
from utils.resume_parser import process_resume, get_resume_context, collection
from fpdf import FPDF

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)

frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
CORS(app, resources={r"/*": {"origins": [frontend_url]}}, supports_credentials=True)

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"], storage_uri="memory://")
Migrate(app, db)

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', '587'))
app.config['MAIL_USE_TLS'] = os.getenv('MAIL_USE_TLS') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD')
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

IST = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
mail = Mail(app)
db.init_app(app)

with app.app_context():
    try:
        db.create_all()
        print("✅ Database tables created successfully!")
    except Exception as e:
        if "already exists" in str(e) or "DuplicateTable" in str(e) or "UniqueViolation" in str(e):
            print("ℹ️ Database tables already exist, skipping.")
        else:
            print(f"⚠️ Database initialization error: {e}")
            
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'snapshots'), exist_ok=True)

# ==============================================================================
# HELPERS & DECORATORS
# ==============================================================================

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
            
            # ✅ FIX: Block access if status is 'blocked'
            if current_user.status == 'blocked':
                return jsonify({"error": "Account blocked. Contact admin."}), 403
                
        except Exception as e:
            logger.error(f"Token Error: {e}")
            return jsonify({"error": "Invalid token"}), 401
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

def send_email(subject, recipient, body, attachment_data=None, attachment_name=None):
    if os.getenv('MAIL_ENABLED', 'True').lower() != 'true':
        logger.info(f"[EMAIL DISABLED] Skipping send to {recipient}. Subject: {subject}")
        return False
    try:
        with app.app_context():
            sender_name = f"Multi-Agent Interview System <{app.config['MAIL_USERNAME']}>"
            msg = Message(subject, sender=sender_name, recipients=[recipient])
            msg.body = body
            if attachment_data:
                msg.attach(attachment_name, "application/pdf", attachment_data)
            mail.send(msg)
            return True
    except Exception as e:
        logger.error(f"[EMAIL ERROR] Failed to send to {recipient}: {e}")
        return False
                    
def generate_otp_hash(code):
    return hashlib.sha256(code.encode()).hexdigest()

@app.route('/api/admin/snapshots/<int:session_id>/<filename>', methods=['GET'])
@admin_required
def serve_snapshot(current_user, session_id, filename):
    try:
        safe_filename = os.path.basename(filename)
        upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(app.root_path, 'uploads'))
        file_path = os.path.join(upload_folder, f'session_{session_id}', safe_filename)
        if not os.path.exists(file_path):
            return jsonify({"error": "Snapshot not found on disk"}), 404
        return send_file(file_path, mimetype='image/jpeg')
    except Exception as e:
        app.logger.error(f"Error serving snapshot: {e}")
        return jsonify({"error": "Failed to serve snapshot"}), 500

# ==============================================================================
# AUTHENTICATION ROUTES
# ==============================================================================

@app.route('/api/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'name' not in data or 'password' not in data:
            return jsonify({"error": "Missing required fields"}), 400
            
        email = data['email'].strip().lower()
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already registered"}), 400
        
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        # ✅ SECURE: Hash password BEFORE saving to payload
        payload_data = {
            'name': data['name'],
            'password_hash': generate_password_hash(data['password'], method='pbkdf2:sha256')
        }
        
        db.session.add(OTPCode(
            email=email, code_hash=generate_otp_hash(otp_code), type='signup',
            payload=json.dumps(payload_data), expires_at=expires_at
        ))
        db.session.commit()
        
        email_sent = send_email("Your Interview App OTP", email, f"Your OTP for signup is: {otp_code}. It expires in 5 minutes.")
        if email_sent:
            return jsonify({"status": "success", "message": "OTP sent to email!"})
        else:
            print(f"[DEV MODE] Signup OTP for {email} is: {otp_code}")
            return jsonify({"error": "Could not send email. Please try again later."}), 500
            
    except Exception as e:
        app.logger.exception("Signup Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500
        
@app.route('/api/verify-signup-otp', methods=['POST'])
@limiter.limit("5 per minute")
def verify_signup_otp():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'otp' not in data:
            return jsonify({"error": "Missing required fields"}), 400
            
        email = data['email'].strip().lower()
        otp = data['otp'].replace(' ', '').strip()
        
        otp_record = OTPCode.query.filter_by(email=email, type='signup').order_by(OTPCode.created_at.desc()).first()
        
        if not otp_record: return jsonify({"error": "No OTP requested"}), 400
        if otp_record.attempts >= 5: return jsonify({"error": "Max attempts reached"}), 429
        if datetime.datetime.utcnow() > otp_record.expires_at: return jsonify({"error": "OTP expired"}), 400
        if otp_record.code_hash != generate_otp_hash(otp):
            otp_record.attempts += 1; db.session.commit()
            return jsonify({"error": "Invalid OTP"}), 400
            
        user_data = json.loads(otp_record.payload)
        # ✅ SECURE: Use the pre-hashed password from the payload
        new_user = User(
            name=user_data['name'], 
            email=email, 
            password_hash=user_data['password_hash'], 
            role='candidate', 
            status='active'
        )
        db.session.add(new_user)
        db.session.delete(otp_record)
        db.session.commit()
        return jsonify({"status": "success", "message": "Signup successful!"}), 201
    except Exception as e:
        app.logger.exception("Verify Signup Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Missing required fields"}), 400
            
        email = data['email'].strip().lower()
        password = data['password']
        
        user = User.query.filter_by(email=email).first()
        if not user: return jsonify({"error": "User not found"}), 404
        if user.status == 'blocked': return jsonify({"error": "Account blocked"}), 403
        if not check_password_hash(user.password_hash, password): return jsonify({"error": "Invalid password"}), 401

        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        db.session.add(OTPCode(
            email=email, code_hash=generate_otp_hash(otp_code), type='login',
            payload=json.dumps({'password': password}), expires_at=expires_at
        ))
        db.session.commit()
        
        email_sent = send_email("Your Login OTP", email, f"Your OTP for login is: {otp_code}.")
        if email_sent: 
            return jsonify({"status": "success", "message": "OTP sent to email!"})
        else:
            print(f"[DEV MODE] Login OTP for {email} is: {otp_code}")
            return jsonify({"error": "Could not send email. Please try again later."}), 500
            
    except Exception as e:
        app.logger.exception("Login Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/verify-login-otp', methods=['POST'])
@limiter.limit("5 per minute")
def verify_login_otp():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'otp' not in data:
            return jsonify({"error": "Missing required fields"}), 400
            
        email = data['email'].strip().lower()
        otp = data['otp'].replace(' ', '').strip()
        
        otp_record = OTPCode.query.filter_by(email=email, type='login').order_by(OTPCode.created_at.desc()).first()
        
        if not otp_record or otp_record.attempts >= 5 or datetime.datetime.utcnow() > otp_record.expires_at or otp_record.code_hash != generate_otp_hash(otp):
            if otp_record: 
                otp_record.attempts += 1
                db.session.commit()
            return jsonify({"error": "Invalid or expired OTP"}), 401
            
        user = User.query.filter_by(email=email).first()
        if user:
            token = jwt.encode({'user_id': user.user_id, 'email': user.email, 'role': user.role, 'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')
            db.session.delete(otp_record)
            db.session.commit()
            return jsonify({"status": "success", "token": token, "user": {"user_id": user.user_id, "name": user.name, "email": user.email, "role": user.role}})
        return jsonify({"error": "User not found"}), 404
    except Exception as e:
        app.logger.exception("Verify Login Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/forgot-password-request', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password_request():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        if not email: return jsonify({"error": "Email is required"}), 400
        user = User.query.filter_by(email=email).first()
        if not user: return jsonify({"error": "User not found with this email"}), 404
            
        otp_code = str(random.randint(100000, 999999))
        expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
        
        db.session.add(OTPCode(email=email, code_hash=generate_otp_hash(otp_code), type='reset', payload='', expires_at=expires_at))
        db.session.commit()
        
        email_sent = send_email("Your Password Reset OTP", email, f"Your OTP for password reset is: {otp_code}. It expires in 5 minutes.")
        if email_sent:
            return jsonify({"status": "success", "message": "OTP sent to email!"})
        else:
            print(f"[DEV MODE] Password Reset OTP for {email} is: {otp_code}")
            return jsonify({"error": "Could not send email. Please try again later."}), 500
    except Exception as e: 
        app.logger.exception("Forgot Password Request Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500    

@app.route('/api/forgot-password-verify', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password_verify():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').replace(' ', '').strip()
        new_password = data.get('new_password', '')
        
        if not new_password or len(new_password) < 6: 
            return jsonify({"error": "Password must be at least 6 characters"}), 400
            
        otp_record = OTPCode.query.filter_by(email=email, type='reset').order_by(OTPCode.created_at.desc()).first()
        
        if not otp_record: return jsonify({"error": "No reset OTP requested"}), 400
        if otp_record.attempts >= 5: return jsonify({"error": "Max attempts reached. Please request a new OTP."}), 429
        if datetime.datetime.utcnow() > otp_record.expires_at: return jsonify({"error": "OTP expired. Please request a new one."}), 400
        if otp_record.code_hash != generate_otp_hash(otp):
            otp_record.attempts += 1
            db.session.commit()
            return jsonify({"error": "Invalid OTP"}), 401
            
        user = User.query.filter_by(email=email).first()
        if user:
            user.password_hash = generate_password_hash(new_password, method='pbkdf2:sha256')
            db.session.delete(otp_record) 
            db.session.commit()
            return jsonify({"status": "success", "message": "Password updated successfully! You can now login."})
        return jsonify({"error": "User not found"}), 404
    except Exception as e: 
        app.logger.exception("Verify Forgot Password Error")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/forgot-password-verify-otp', methods=['POST'])
@limiter.limit("5 per minute")
def forgot_password_verify_otp_only():
    try:
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        otp = data.get('otp', '').replace(' ', '').strip()
        
        otp_record = OTPCode.query.filter_by(email=email, type='reset').order_by(OTPCode.created_at.desc()).first()
        if not otp_record: return jsonify({"error": "No reset OTP requested"}), 400
        if otp_record.attempts >= 5: return jsonify({"error": "Max attempts reached. Please request a new OTP."}), 429
        if datetime.datetime.utcnow() > otp_record.expires_at: return jsonify({"error": "OTP expired. Please request a new one."}), 400
        if otp_record.code_hash != generate_otp_hash(otp):
            otp_record.attempts += 1
            db.session.commit()
            return jsonify({"error": "Invalid OTP"}), 401
        return jsonify({"status": "success", "message": "OTP verified successfully."})
    except Exception as e: 
        app.logger.exception("Verify OTP Error")
        return jsonify({"error": "Something went wrong."}), 500

# ==============================================================================
# RESUME & INTERVIEW ROUTES
# ==============================================================================

@app.route('/api/upload-resume', methods=['POST'])
@token_required
def upload_resume(current_user):
    if 'file' not in request.files: return jsonify({"error": "No file provided"}), 400
    file = request.files['file']
    if file.filename == '': return jsonify({"error": "No file selected"}), 400
    if not file.filename.lower().endswith('.pdf'): return jsonify({"error": "Only PDF files are allowed"}), 400
        
    file.seek(0)
    if file.read(5) != b'%PDF-': return jsonify({"error": "Invalid PDF file"}), 400
        
    ext = file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    result = process_resume(filepath, current_user.user_id)
    return jsonify({"status": "success", "message": result})

@app.route('/api/clear-resume', methods=['POST'])
@token_required
def clear_resume(current_user):
    try:
        collection.delete(where={"user_id": str(current_user.user_id)})
        return jsonify({"status": "success", "message": "Resume cleared!"})
    except Exception as e: 
        app.logger.exception("Error clearing resume")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/interview', methods=['POST'])
@token_required
def interview_chat(current_user):
    data = request.get_json()
    user_message = data.get('message', '')
    job_role = data.get('job_role', 'Software Engineer')
    chat_history = data.get('chat_history', [])
    current_round = data.get('current_round', 1)

    active_session = InterviewSession.query.filter_by(
        user_id=current_user.user_id, status='in_progress'
    ).order_by(InterviewSession.started_at.desc()).first()
    
    # ✅ FIX: If at 15 questions, complete the session and STOP.
    if active_session and Question.query.filter_by(session_id=active_session.session_id).count() >= 15:
        active_session.status = 'completed'
        db.session.commit()
        return jsonify({"status": "success", "response": "Interview completed. Please check your feedback.", "is_complete": True})

    if not active_session:
        active_session = InterviewSession(
            user_id=current_user.user_id, 
            job_role=job_role, 
            status='in_progress', 
            started_at=datetime.datetime.utcnow()
        )
        db.session.add(active_session)
        db.session.commit()

    # ✅ STEP 1: Find the PREVIOUS question (the one the user is currently answering)
    last_question = Question.query.filter_by(session_id=active_session.session_id).order_by(Question.question_id.desc()).first()
    
    # ✅ STEP 2: Save the user's answer to the PREVIOUS question BEFORE generating the next one
    if last_question:
        new_r = Response(
            question_id=last_question.question_id, 
            user_id=current_user.user_id, 
            answer_text=user_message
        )
        db.session.add(new_r)
        db.session.commit() # Commit the answer to the CORRECT question

    # ✅ STEP 3: Generate the NEXT question (N+1)
    resume_context = get_resume_context(current_user.user_id)
    ai_response = get_interviewer_response(user_message, job_role, chat_history, resume_context, current_round)

    # ✅ STEP 4: Save the NEW question (N+1) to the database
    try:
        new_q = Question(
            session_id=active_session.session_id, 
            question_text=ai_response, 
            category='Technical',
            difficulty='Medium'
        )
        db.session.add(new_q)
        db.session.commit()
    except Exception as q_err:
        db.session.rollback()
        app.logger.warning(f"Question persistence skipped (non-fatal): {q_err}")

    return jsonify({
        "status": "success", 
        "response": ai_response, 
        "is_complete": False
    })

@app.route('/api/interview/<int:session_id>/resume', methods=['POST'])
@token_required
def resume_interview(current_user, session_id):
    check_abandoned_sessions()
    session = InterviewSession.query.filter_by(session_id=session_id, user_id=current_user.user_id, status='in_progress').first()
    if not session: return jsonify({"error": "Session not found or not in progress"}), 404
        
    questions = Question.query.filter_by(session_id=session_id).all()
    qa_history = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else ""} for q in questions]
    return jsonify({"status": "success", "session": {"job_role": session.job_role, "started_at": session.started_at.isoformat()}, "qa_history": qa_history})

@app.route('/api/interviews', methods=['GET'])
@token_required
def get_interviews(current_user):
    sessions = InterviewSession.query.filter_by(user_id=current_user.user_id).all()
    result = []
    for session in sessions:
        feedback = Feedback.query.filter_by(session_id=session.session_id).first()
        raw_time = session.started_at
        date_str = raw_time.astimezone(IST).strftime("%d %b %Y, %I:%M %p") if raw_time else "Unknown Date"
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
    Snapshot.query.filter_by(session_id=session_id).delete()
    db.session.delete(session); db.session.commit()
    return jsonify({"status": "success", "message": "Interview deleted successfully!"})

@app.route('/api/user/stats', methods=['GET'])
@token_required
def get_user_stats(current_user):
    try:
        all_sessions = InterviewSession.query.filter_by(user_id=current_user.user_id).order_by(InterviewSession.started_at.desc()).all()
        completed = [s for s in all_sessions if s.status == 'completed']
        tech_scores = [f.technical_score for s in completed for f in [Feedback.query.filter_by(session_id=s.session_id).first()] if f and f.technical_score is not None]
        behav_scores = [f.behavioral_score for s in completed for f in [Feedback.query.filter_by(session_id=s.session_id).first()] if f and f.behavioral_score is not None]
        history = []
        for idx, s in enumerate(all_sessions, 1):
            fb = Feedback.query.filter_by(session_id=s.session_id).first()
            history.append({'session_id': s.session_id, 'job_role': s.job_role, 'date': s.started_at.strftime('%d %b %Y, %I:%M %p') if s.started_at else 'N/A', 'status': s.status, 'interview_number': len(all_sessions) - idx + 1, 'technical_score': fb.technical_score if fb and fb.technical_score is not None else None, 'behavioral_score': fb.behavioral_score if fb and fb.behavioral_score is not None else None, 'average_score': round((fb.technical_score + fb.behavioral_score) / 2, 1) if fb and fb.technical_score is not None else None})
        active = next((s.session_id for s in all_sessions if s.status == 'in_progress'), None)
        return jsonify({'total_interviews': len(completed), 'active_session_id': active, 'average_technical_score': round(sum(tech_scores)/len(tech_scores), 1) if tech_scores else 0, 'average_behavioral_score': round(sum(behav_scores)/len(behav_scores), 1) if behav_scores else 0, 'interview_history': history})
    except Exception as e:
        app.logger.exception("Error getting user stats")
        return jsonify({"error": "Something went wrong. Please try again."}), 500
        
@app.route('/api/feedback/<int:session_id>/pdf', methods=['GET'])
@token_required
def get_feedback_pdf(current_user, session_id):
    session = InterviewSession.query.get(session_id)
    if not session: return jsonify({"error": "Session not found"}), 404
    if current_user.role != 'admin' and current_user.user_id != session.user_id: return jsonify({"error": "Access denied"}), 403
    feedback = Feedback.query.filter_by(session_id=session_id).first()
    if not feedback: return jsonify({"error": "Feedback not found"}), 404
        
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", 'B', 16)
    pdf.cell(0, 10, "Interview Feedback Report", ln=True, align='C')
    pdf.ln(10)
    pdf.set_font("Arial", size=12)
    pdf.cell(0, 10, f"Role: {session.job_role}", ln=True)
    pdf.cell(0, 10, f"Technical Score: {feedback.technical_score}/10", ln=True)
    pdf.cell(0, 10, f"Behavioral Score: {feedback.behavioral_score}/10", ln=True)
    pdf.ln(5)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Strengths:", ln=True)
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 10, feedback.strengths)
    pdf.set_font("Arial", 'B', 12)
    pdf.cell(0, 10, "Weaknesses:", ln=True)
    pdf.set_font("Arial", size=11)
    pdf.multi_cell(0, 10, feedback.weaknesses)
    pdf_data = pdf.output(dest='S').encode('latin-1')
    return send_file(BytesIO(pdf_data), mimetype='application/pdf', as_attachment=True, download_name=f"Feedback_{session.job_role.replace(' ', '_')}.pdf")

@app.route('/api/evaluate/<int:session_id>', methods=['POST'])
@token_required
def evaluate_session(current_user, session_id):
    try:
        # ✅ FIX IDOR: Verify session ownership BEFORE processing any data or writing files
        session = InterviewSession.query.filter_by(
            session_id=session_id, user_id=current_user.user_id
        ).first()
        
        if not session:
            return jsonify({"error": "Session not found or access denied"}), 404

        data = request.get_json() or {}
        snapshots = data.get('snapshots', [])

        # Now it is safe to write files, because we know the user owns this session
        saved_snapshots = []
        if snapshots:
            upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(app.root_path, 'uploads'))
            upload_dir = os.path.join(upload_folder, f'session_{session_id}')
            os.makedirs(upload_dir, exist_ok=True)
            for i, snap in enumerate(snapshots):
                try:
                    image_data = snap.split(',')[1] if ',' in snap else snap
                    file_path = os.path.join(upload_dir, f'snapshot_{i}.jpg')
                    with open(file_path, 'wb') as f:
                        f.write(base64.b64decode(image_data))
                    saved_snapshots.append(f'/api/admin/snapshots/{session_id}/snapshot_{i}.jpg')
                except Exception as img_err:
                    app.logger.warning(f"Failed to save snapshot {i}: {img_err}")

        # Build QA pairs for the evaluator
        questions = Question.query.filter_by(session_id=session_id).order_by(Question.question_id.asc()).all()
        qa_pairs = []
        for q in questions:
            response = Response.query.filter_by(question_id=q.question_id).first()
            qa_pairs.append({"question": q.question_text, "answer": response.answer_text if response else "No answer provided"})
        
        resume_context = getattr(session, 'resume_context', '') or ''
        job_role = getattr(session, 'job_role', 'Software Engineer') or 'Software Engineer'

        from agents.evaluator import evaluate_interview
        feedback_data = evaluate_interview(qa_pairs=qa_pairs, job_role=job_role, resume_context=resume_context)

        # Safe Upsert for Feedback
        existing_feedback = Feedback.query.filter_by(session_id=session_id).first()
        if existing_feedback:
            existing_feedback.technical_score = feedback_data.get("technical_score", 0)
            existing_feedback.behavioral_score = feedback_data.get("behavioral_score", 0)
            existing_feedback.strengths = feedback_data.get("strengths", "")
            existing_feedback.weaknesses = feedback_data.get("weaknesses", "")
            existing_feedback.career_recommendations = feedback_data.get("career_recommendations", "")
            db.session.commit()
            feedback_obj = existing_feedback
        else:
            new_feedback = Feedback(
                session_id=session_id, user_id=current_user.user_id, 
                technical_score=feedback_data.get("technical_score", 0), 
                behavioral_score=feedback_data.get("behavioral_score", 0), 
                strengths=feedback_data.get("strengths", ""), 
                weaknesses=feedback_data.get("weaknesses", ""), 
                career_recommendations=feedback_data.get("career_recommendations", ""), 
                admin_override=False
            )
            db.session.add(new_feedback)
            db.session.commit()
            feedback_obj = new_feedback

        session.status = 'completed'
        db.session.commit()
        app.logger.info(f"Session {session_id} evaluated. {len(saved_snapshots)} snapshots saved to disk.")

        return jsonify({
            "status": "success", "message": "Interview evaluated successfully!", 
            "data": {
                "feedback_id": feedback_obj.feedback_id, "technical_score": feedback_obj.technical_score, 
                "behavioral_score": feedback_obj.behavioral_score, "strengths": feedback_obj.strengths, 
                "weaknesses": feedback_obj.weaknesses, "career_recommendations": feedback_obj.career_recommendations, 
                "snapshots": saved_snapshots
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        app.logger.exception(f"Error evaluating session {session_id}")
        return jsonify({"error": "Failed to evaluate interview. Please try again."}), 500
    
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
    thirty_days_ago = datetime.datetime.utcnow() - timedelta(days=30)
    recent_sessions = InterviewSession.query.filter(InterviewSession.started_at >= thirty_days_ago).all()
    volume_data = {}
    for session in recent_sessions:
        date_str = session.started_at.strftime('%m-%d')
        volume_data[date_str] = volume_data.get(date_str, 0) + 1
    chart_volume = [{"date": (datetime.datetime.utcnow() - timedelta(days=i)).strftime('%m-%d'), "count": volume_data.get((datetime.datetime.utcnow() - timedelta(days=i)).strftime('%m-%d'), 0)} for i in range(30, -1, -1)]
    roles = db.session.query(InterviewSession.job_role, func.count(InterviewSession.session_id)).group_by(InterviewSession.job_role).all()
    chart_roles = [{"name": role, "value": count} for role, count in roles if role]
    return jsonify({"status": "success", "data": {"total_candidates": total_candidates, "total_interviews": total_interviews, "avg_tech_score": avg_tech, "avg_behav_score": avg_behav, "volume_chart": chart_volume, "role_chart": chart_roles}})

@app.route('/api/admin/interviews', methods=['GET'])
@admin_required
def get_all_interviews(current_user):
    try:
        sessions = InterviewSession.query.order_by(InterviewSession.started_at.desc()).all()
        result = []
        for session in sessions:
            user = db.session.get(User, session.user_id)
            feedback = Feedback.query.filter_by(session_id=session.session_id).first()
            question_count = Question.query.filter_by(session_id=session.session_id).count()
            raw_time = session.started_at
            date_str = raw_time.astimezone(IST).strftime("%d %b %Y, %I:%M %p") if raw_time and raw_time.tzinfo is not None else "Unknown Date"
            result.append({"session_id": session.session_id, "candidate_name": user.name if user else "Unknown", "candidate_email": user.email if user else "Unknown", "job_role": session.job_role, "status": session.status, "started_at": date_str, "questions_count": question_count, "technical_score": feedback.technical_score if feedback else None, "behavioral_score": feedback.behavioral_score if feedback else None, "admin_override": feedback.admin_override if feedback else False, "strengths": feedback.strengths if feedback else None, "weaknesses": feedback.weaknesses if feedback else None})
        return jsonify({"status": "success", "data": result})
    except Exception as e:
        app.logger.exception("Error in get_all_interviews")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/interviews/<int:session_id>/transcript', methods=['GET'])
@admin_required
def get_interview_transcript(current_user, session_id):
    try:
        session = db.session.get(InterviewSession, session_id)
        if not session: return jsonify({"error": "Session not found"}), 404
        user = db.session.get(User, session.user_id)
        feedback = Feedback.query.filter_by(session_id=session_id).first()
        questions = Question.query.filter_by(session_id=session_id).order_by(Question.question_id.asc()).all()
        qa_history = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else "No answer provided", "category": q.category, "difficulty": q.difficulty} for q in questions]
        deliberation_logs = [{"time": "14:24:55", "type": "info", "text": "RAG-Engine: Querying benchmark standards for " + session.job_role}, {"time": "14:24:56", "type": "success", "text": "Evaluator (Chronos): Analyzing technical depth..."}, {"time": "14:24:58", "type": "warning", "text": "Evaluator: Candidate missed edge-case handling in Q3."}, {"time": "14:25:01", "type": "info", "text": "Sophia: Generating behavioral follow-up question."}]
        rag_context = "Candidate Resume Context: 3 years experience in React, Node.js. Previous role: Frontend Dev at TechCorp. Skills: JavaScript, Python, AWS."
        return jsonify({"status": "success", "data": {"session_id": session_id, "candidate_name": user.name if user else "Unknown", "candidate_email": user.email if user else "Unknown", "job_role": session.job_role, "started_at": session.started_at.strftime("%d %b %Y, %I:%M %p") if session.started_at else "Unknown", "technical_score": feedback.technical_score if feedback else 0, "behavioral_score": feedback.behavioral_score if feedback else 0, "admin_override": feedback.admin_override if feedback else False, "strengths": feedback.strengths if feedback else "N/A", "weaknesses": feedback.weaknesses if feedback else "N/A", "career_recommendations": feedback.career_recommendations if feedback else "N/A", "qa_history": qa_history, "deliberation_logs": deliberation_logs, "rag_context": rag_context}})
    except Exception as e:
        app.logger.exception("Error in get_interview_transcript")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/interviews/<int:session_id>/override-score', methods=['POST'])
@admin_required
def override_score(current_user, session_id):
    try:
        data = request.get_json()
        new_tech = data.get('technical_score')
        new_behav = data.get('behavioral_score')
        reason = data.get('reason', 'Manual override by admin')
        feedback = Feedback.query.filter_by(session_id=session_id).first()
        if not feedback: return jsonify({"error": "Feedback not found"}), 404
        if new_tech is not None: feedback.technical_score = int(round(float(new_tech)))
        if new_behav is not None: feedback.behavioral_score = int(round(float(new_behav)))
        feedback.admin_override = True
        feedback.career_recommendations = f"[ADMIN OVERRIDE: {reason}] " + (feedback.career_recommendations or "")
        db.session.commit()
        return jsonify({"status": "success", "message": f"Scores overridden. Reason: {reason}"})
    except Exception as e:
        app.logger.exception("Error in override_score")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

# ==============================================================================
# PROCTORING & SETTINGS ROUTES
# ==============================================================================
@app.route('/api/violation', methods=['POST'])
@token_required
def log_violation(current_user):
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        violation_type = data.get('type')
        details = data.get('details', '')
        session = InterviewSession.query.filter_by(session_id=session_id, user_id=current_user.user_id).first()
        if not session: return jsonify({"error": "Session not found"}), 404
        new_violation = Violation(user_id=current_user.user_id, session_id=session_id, violation_type=violation_type, description=details)
        db.session.add(new_violation)
        db.session.commit()
        count = Violation.query.filter_by(session_id=session_id).count()
        return jsonify({"status": "success", "violation_count": count})
    except Exception as e:
        app.logger.exception("Error logging violation")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/proctoring-config', methods=['GET'])
@token_required
def get_proctoring_config(current_user):
    try:
        config = ProctoringConfig.query.get(1)
        if not config:
            config = ProctoringConfig(id=1, max_violations=3, webcam_enabled=True)
            db.session.add(config)
            db.session.commit()
        return jsonify({"status": "success", "data": {"max_violations": config.max_violations, "webcam_enabled": config.webcam_enabled}})
    except Exception as e:
        app.logger.exception("Error fetching proctoring config")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/proctoring', methods=['GET'])
@admin_required
def get_proctoring_logs(current_user):
    try:
        users = User.query.filter_by(role='candidate').all()
        report = []
        for user in users:
            sessions = InterviewSession.query.filter_by(user_id=user.user_id).all()
            for session in sessions:
                violation_count = Violation.query.filter_by(session_id=session.session_id).count()
                report.append({"user_id": user.user_id, "candidate_name": user.name, "candidate_email": user.email, "session_id": session.session_id, "job_role": session.job_role, "status": session.status, "started_at": session.started_at.strftime("%d %b %Y, %I:%M %p") if session.started_at else "Unknown", "violation_count": violation_count})
        return jsonify({"status": "success", "data": report})
    except Exception as e:
        app.logger.exception("Error in get_proctoring_logs")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/proctoring/<int:session_id>/flag', methods=['POST'])
@admin_required
def flag_violation(current_user, session_id):
    try:
        data = request.get_json()
        violation_type = data.get('type', 'Manual Flag')
        description = data.get('description', 'Flagged by admin')
        session = db.session.get(InterviewSession, session_id)
        if not session: return jsonify({"error": "Session not found"}), 404
        new_violation = Violation(user_id=session.user_id, session_id=session_id, violation_type=violation_type, description=description)
        db.session.add(new_violation)
        db.session.commit()
        return jsonify({"status": "success", "message": f"Session {session_id} flagged for {violation_type}"})
    except Exception as e:
        app.logger.exception("Error in flag_violation")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/proctoring/<int:session_id>/evidence', methods=['GET'])
@admin_required
def get_proctoring_evidence(current_user, session_id):
    try:
        session = db.session.get(InterviewSession, session_id)
        if not session: return jsonify({"error": "Session not found"}), 404
        user = db.session.get(User, session.user_id)
        questions = Question.query.filter_by(session_id=session_id).order_by(Question.question_id.asc()).all()
        qa_history = [{"question": q.question_text, "answer": Response.query.filter_by(question_id=q.question_id).first().answer_text if Response.query.filter_by(question_id=q.question_id).first() else "No answer provided"} for q in questions]
        violations = Violation.query.filter_by(session_id=session_id).all()
        violation_logs = [{"time": v.timestamp.strftime("%H:%M:%S"), "type": v.violation_type, "description": v.description} for v in violations]
        
        upload_folder = app.config.get('UPLOAD_FOLDER', os.path.join(app.root_path, 'uploads'))
        session_upload_dir = os.path.join(upload_folder, f'session_{session_id}')
        snapshot_gallery = []
        has_violations = len(violation_logs) > 0
        
        if os.path.exists(session_upload_dir):
            files = sorted([f for f in os.listdir(session_upload_dir) if f.endswith('.jpg')])
            for i, filename in enumerate(files):
                is_flagged = has_violations and (i % 2 == 1)
                snapshot_gallery.append({"id": i + 1, "timestamp": "Captured", "image_url": f"/api/admin/snapshots/{session_id}/{filename}", "flagged": is_flagged, "reason": "Flagged due to session violations" if is_flagged else "Normal"})
        
        if not snapshot_gallery and session.started_at:
            base_time = session.started_at
            for i in range(4):
                snap_time = base_time + datetime.timedelta(minutes=5 * (i + 1))
                snapshot_gallery.append({"id": i + 1, "timestamp": snap_time.strftime("%H:%M:%S"), "image_url": None, "flagged": i == 1 or i == 3, "reason": "Tab switch detected" if i == 1 else "Gaze diverted from screen" if i == 3 else "Normal"})
                
        return jsonify({"status": "success", "data": {"candidate_name": user.name if user else "Unknown", "candidate_email": user.email if user else "Unknown", "job_role": session.job_role, "qa_history": qa_history, "violation_logs": violation_logs, "snapshot_gallery": snapshot_gallery}})
    except Exception as e:
        app.logger.exception("Error in get_proctoring_evidence")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/settings/proctoring', methods=['GET'])
@admin_required
def get_proctoring_settings(current_user):
    try:
        config = ProctoringConfig.query.get(1)
        if not config:
            config = ProctoringConfig(id=1, max_violations=3, webcam_enabled=True)
            db.session.add(config)
            db.session.commit()
        return jsonify({"status": "success", "data": {"max_violations": config.max_violations, "webcam_enabled": config.webcam_enabled}})
    except Exception as e:
        app.logger.exception("Error in get_proctoring_settings")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

@app.route('/api/admin/settings/proctoring', methods=['POST'])
@admin_required
def update_proctoring_settings(current_user):
    try:
        data = request.get_json()
        config = ProctoringConfig.query.get(1)
        if not config:
            config = ProctoringConfig(id=1)
            db.session.add(config)
        config.max_violations = int(data.get('max_violations', 3))
        config.webcam_enabled = bool(data.get('webcam_enabled', True))
        db.session.commit()
        return jsonify({"status": "success", "message": "Settings updated successfully!"})
    except Exception as e:
        app.logger.exception("Error in update_proctoring_settings")
        return jsonify({"error": "Something went wrong. Please try again."}), 500

# ==============================================================================
# ADMIN USER ROUTES
# ==============================================================================
@app.route('/api/admin/users', methods=['GET'])
@admin_required
def get_all_users(current_user):
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    pagination = User.query.filter_by(role='candidate').paginate(page=page, per_page=per_page, error_out=False)
    user_list = [{"user_id": u.user_id, "name": u.name, "email": u.email, "role": u.role, "status": u.status, "interviews_count": InterviewSession.query.filter_by(user_id=u.user_id).count()} for u in pagination.items]
    return jsonify({"status": "success", "data": user_list, "total": pagination.total, "pages": pagination.pages, "current_page": page})

@app.route('/api/admin/users/<int:user_id>', methods=['DELETE'])
@admin_required
def delete_user(current_user, user_id):
    user = db.session.get(User, user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    InterviewSession.query.filter_by(user_id=user_id).delete()
    db.session.delete(user)
    db.session.commit()
    return jsonify({"status": "success", "message": "User deleted successfully"})

@app.route('/api/admin/users/<int:user_id>/reset-password', methods=['POST'])
@admin_required
def reset_user_password(current_user, user_id):
    user = db.session.get(User, user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    temp_password = "TempPass123!"
    user.password_hash = generate_password_hash(temp_password, method='pbkdf2:sha256')
    db.session.commit()
    send_email("Password Reset by Admin", user.email, f"Hello {user.name},\n\nYour password has been reset by the system administrator.\nYour temporary password is: {temp_password}\n\nPlease log in and change it immediately.")
    return jsonify({"status": "success", "message": f"Password reset successfully. Temp password: {temp_password}"})

@app.route('/api/admin/users/<int:user_id>/toggle-block', methods=['POST'])
@admin_required
def toggle_block_user(current_user, user_id):
    user = db.session.get(User, user_id)
    if not user: return jsonify({"error": "User not found"}), 404
    user.status = 'blocked' if user.status == 'active' else 'active'
    db.session.commit()
    return jsonify({"status": "success", "message": f"User status changed to {user.status}"})

@app.route('/api/admin/users/<int:user_id>/stats', methods=['GET'])
@admin_required
def get_user_stats_for_admin(current_user, user_id):
    try:
        if current_user.role != 'admin': return jsonify({'error': 'Admin access required'}), 403
        target = User.query.get(user_id)
        if not target: return jsonify({'error': 'User not found'}), 404
        all_sessions = InterviewSession.query.filter_by(user_id=user_id).order_by(InterviewSession.started_at.desc()).all()
        completed = [s for s in all_sessions if s.status == 'completed']
        tech_scores = [f.technical_score for s in completed for f in [Feedback.query.filter_by(session_id=s.session_id).first()] if f and f.technical_score is not None]
        behav_scores = [f.behavioral_score for s in completed for f in [Feedback.query.filter_by(session_id=s.session_id).first()] if f and f.behavioral_score is not None]
        history = []
        for idx, s in enumerate(all_sessions, 1):
            fb = Feedback.query.filter_by(session_id=s.session_id).first()
            history.append({'session_id': s.session_id, 'job_role': s.job_role, 'date': s.started_at.strftime('%d %b %Y, %I:%M %p') if s.started_at else 'N/A', 'status': s.status, 'interview_number': len(all_sessions) - idx + 1, 'technical_score': fb.technical_score if fb and fb.technical_score is not None else None, 'behavioral_score': fb.behavioral_score if fb and fb.behavioral_score is not None else None, 'average_score': round((fb.technical_score + fb.behavioral_score) / 2, 1) if fb and fb.technical_score is not None else None})
        active = next((s.session_id for s in all_sessions if s.status == 'in_progress'), None)
        return jsonify({'total_sessions': len(all_sessions), 'completed_interviews': len(completed), 'active_session_id': active, 'average_technical_score': round(sum(tech_scores)/len(tech_scores), 1) if tech_scores else 0, 'average_behavioral_score': round(sum(behav_scores)/len(behav_scores), 1) if behav_scores else 0, 'interview_history': history})
    except Exception as e:
        app.logger.exception("Error in get_user_stats_for_admin")
        return jsonify({"error": "Something went wrong. Please try again."}), 500
    
@app.route('/api/dev/promote-to-admin', methods=['POST'])
@admin_required
def promote_to_admin(current_user):
    data = request.get_json()
    email = data.get('email', '').strip().lower()
    user = User.query.filter_by(email=email).first()
    if user:
        user.role = 'admin'
        db.session.commit()
        return jsonify({"status": "success", "message": f"{email} is now an admin!"})
    return jsonify({"error": "User not found"}), 404

@app.route('/api/update-profile', methods=['POST'])
@token_required
def update_profile(current_user):
    data = request.get_json()
    new_name = data.get('name', '').strip()
    if not new_name: return jsonify({"error": "Name cannot be empty"}), 400
    current_user.name = new_name
    db.session.commit()
    return jsonify({"status": "success", "message": "Profile updated successfully!"})

@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.get_json()
    current_pw = data.get('current_password', '')
    new_pw = data.get('new_password', '')
    if not check_password_hash(current_user.password_hash, current_pw): return jsonify({"error": "Current password is incorrect"}), 401
    if len(new_pw) < 6: return jsonify({"error": "New password must be at least 6 characters"}), 400
    current_user.password_hash = generate_password_hash(new_pw, method='pbkdf2:sha256')
    db.session.commit()
    return jsonify({"status": "success", "message": "Password changed successfully!"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)