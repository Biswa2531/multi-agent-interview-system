import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.utils import secure_filename
from config import Config
from models import db, User, InterviewSession, Question, Response, Feedback
from agents.interviewer import get_interviewer_response
from agents.evaluator import evaluate_interview
from utils.resume_parser import process_resume

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

# --- Test Route ---
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "success", "message": "Multi-Agent Interview System Backend is Running!"})

# --- Day 4 Route: Upload and Parse Resume ---
@app.route('/api/upload-resume', methods=['POST'])
def upload_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file:
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        file.save(file_path)
        
        # Process the resume with ChromaDB
        result = process_resume(file_path)
        
        return jsonify({"status": "success", "message": result, "filename": filename})

# --- AI Interview Route ---
@app.route('/api/interview', methods=['POST'])
def interview_chat():
    data = request.get_json()
    user_message = data.get('message', '')
    job_role = data.get('job_role', 'Software Engineer')
    chat_history = data.get('chat_history', [])

    if not user_message:
        return jsonify({"error": "Message is required"}), 400

    test_user = User.query.filter_by(email='demo@candidate.com').first()
    if not test_user:
        test_user = User(name='Demo Candidate', email='demo@candidate.com', password_hash='dummy_hash', role='candidate')
        db.session.add(test_user)
        db.session.commit()

    new_session = InterviewSession(user_id=test_user.user_id, job_role=job_role, status='in_progress')
    db.session.add(new_session)
    db.session.commit() 

    ai_response = get_interviewer_response(user_message, job_role, chat_history)

    new_question = Question(session_id=new_session.session_id, question_text=ai_response, category='Technical', difficulty='Medium')
    db.session.add(new_question)
    db.session.commit() 

    new_response = Response(question_id=new_question.question_id, user_id=test_user.user_id, answer_text=user_message)
    db.session.add(new_response)
    db.session.commit()
    
    return jsonify({"status": "success", "response": ai_response})

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