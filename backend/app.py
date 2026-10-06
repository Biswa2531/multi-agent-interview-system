import os
import jwt
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
from config import Config
from models import db, User, InterviewSession, Question, Response, Feedback
from agents.interviewer import get_interviewer_response
from agents.evaluator import evaluate_interview
from utils.resume_parser import process_resume, get_resume_context, collection

# Initialize the Flask app
app = Flask(__name__)
app.config.from_object(Config)

# Allow the React frontend to communicate with this Flask backend
CORS(app)

# Initialize the database with the app
db.init_app(app)

# Create the database tables automatically
with app.app_context():
    db.create_all()
    print("✅ Database tables created successfully!")

# Ensure upload folder exists
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# --- JWT Token Verification Decorator ---
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        try:
            token = token.split(" ")[1]  # Remove "Bearer " prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({"error": "User not found"}), 401
        except Exception as e:
            return jsonify({"error": "Token is invalid"}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- Test Route ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "success", "message": "Multi-Agent Interview System Backend is Running!"})

# --- Signup Route ---
@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.get_json()
    name = data.get('name', '')
    email = data.get('email', '')
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({"error": "All fields are required"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(name=name, email=email, password_hash=hashed_password, role='candidate')
    db.session.add(new_user)
    db.session.commit()

    return jsonify({"status": "success", "message": "User registered successfully!"}), 201

# --- Login Route ---
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = jwt.encode({
        'user_id': user.user_id,
        'email': user.email,
        'role': user.role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')

    return jsonify({
        "status": "success",
        "token": token,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    })

# --- Upload and Parse Resume (Protected by JWT & Isolated by User ID) ---
@app.route('/api/upload-resume', methods=['POST'])
@token_required
def upload_resume(current_user):
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        result = process_resume(file_path, current_user.user_id)
        return jsonify({"status": "success", "message": result, "filename": filename})

# --- Clear Resume Route ---
@app.route('/api/clear-resume', methods=['POST'])
@token_required
def clear_resume(current_user):
    try:
        collection.delete(where={"user_id": str(current_user.user_id)})
        return jsonify({"status": "success", "message": "✅ Resume data cleared successfully!"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
# --- AI Interview Route (Protected by JWT) ---
@app.route('/api/interview', methods=['POST'])
@token_required
def interview_chat(current_user):
    data = request.get_json()
    user_message = data.get('message', '')
    job_role = data.get('job_role', 'Software Engineer')
    chat_history = data.get('chat_history', [])

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    # 1. Find the most recent active session
    active_session = InterviewSession.query.filter_by(
        user_id=current_user.user_id, 
        status='in_progress'
    ).order_by(InterviewSession.started_at.desc()).first()

    # --- THE FIX: If the old session already has 5 questions, it's finished. Start a new one! ---
    if active_session:
        old_question_count = Question.query.filter_by(session_id=active_session.session_id).count()
        if old_question_count >= 5:
            active_session.status = 'completed' # Mark old one as done
            db.session.commit()
            active_session = None # Force creation of a new session

    # 2. Create a new session if none exists (or if we just discarded the old one)
    if not active_session:
        active_session = InterviewSession(user_id=current_user.user_id, job_role=job_role, status='in_progress')
        db.session.add(active_session)
        db.session.commit() 

    # 3. Check how many ACTUAL questions have been asked in THIS NEW session
    question_count = Question.query.filter_by(session_id=active_session.session_id).count()

    # 4. If 5 questions have already been asked in this NEW session, conclude
    if question_count >= 5:
        concluding_message = "Thank you for your answers. We have completed the 5-question round. I will now generate your comprehensive evaluation report."
        return jsonify({
            "status": "success", 
            "response": concluding_message,
            "is_complete": True
        })

    # 5. Otherwise, generate the next question
    resume_context = get_resume_context(current_user.user_id)
    
    print(f"--- RESUME CONTEXT FOR USER {current_user.user_id} ---")
    print(resume_context[:200] if resume_context else "NO RESUME CONTEXT FOUND")
    print("------------------------------------------------------")
    
    ai_response = get_interviewer_response(user_message, job_role, chat_history, resume_context)

    # 6. Save the new question and the user's answer to the database
    new_question = Question(session_id=active_session.session_id, question_text=ai_response, category='Technical', difficulty='Medium')
    db.session.add(new_question)
    db.session.commit() 

    new_response = Response(question_id=new_question.question_id, user_id=current_user.user_id, answer_text=user_message)
    db.session.add(new_response)
    db.session.commit()
    
    return jsonify({
        "status": "success", 
        "response": ai_response,
        "is_complete": False
    })

# --- Admin Route: Get All Saved Interviews ---
@app.route('/api/interviews', methods=['GET'])
def get_interviews():
    sessions = InterviewSession.query.all()
    result = []
    for session in sessions:
        questions = Question.query.filter_by(session_id=session.session_id).all()
        session_data = {
            "session_id": session.session_id,
            "job_role": session.job_role,
            "status": session.status,
            "started_at": session.started_at.strftime("%Y-%m-%d %H:%M:%S"),
            "qa_pairs": []
        }
        for q in questions:
            response = Response.query.filter_by(question_id=q.question_id).first()
            session_data["qa_pairs"].append({
                "question": q.question_text,
                "answer": response.answer_text if response else "No answer provided",
                "category": q.category
            })
        result.append(session_data)
    result.reverse()
    return jsonify({"status": "success", "data": result})

# --- Evaluation Route ---
@app.route('/api/evaluate/<int:session_id>', methods=['POST'])
def evaluate_session(session_id):
    try:
        session = InterviewSession.query.get(session_id)
        if not session:
            return jsonify({"error": "Session not found"}), 404

        questions = Question.query.filter_by(session_id=session_id).all()
        qa_pairs = []
        for q in questions:
            response = Response.query.filter_by(question_id=q.question_id).first()
            qa_pairs.append({"question": q.question_text, "answer": response.answer_text if response else "No answer"})

        feedback_data = evaluate_interview(qa_pairs, session.job_role)

        new_feedback = Feedback(
            session_id=session_id, user_id=session.user_id,
            technical_score=feedback_data.get("technical_score", 5),
            behavioral_score=feedback_data.get("behavioral_score", 5),
            strengths=feedback_data.get("strengths", ""),
            weaknesses=feedback_data.get("weaknesses", ""),
            career_recommendations=feedback_data.get("career_recommendations", "")
        )
        db.session.add(new_feedback)
        session.status = 'completed'
        db.session.commit()

        return jsonify({"status": "success", "feedback": feedback_data})
    except Exception as e:
        print(f"Evaluation Error: {e}")
        return jsonify({"error": "Failed to evaluate interview"}), 500

# --- Run the Server ---
if __name__ == '__main__':
    app.run(debug=True, port=5000)