from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='candidate') # 'candidate' or 'admin'

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    session_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    job_role = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='in_progress')
    started_at = db.Column(db.DateTime, default=datetime.utcnow)

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='Technical')
    difficulty = db.Column(db.String(20), default='Medium')
    
    # --- NEW FIELDS FOR WEEK 5 ---
    round_type = db.Column(db.String(50), default='Conceptual') # Conceptual, Coding, Behavioral
    time_limit_seconds = db.Column(db.Integer, default=180) # 3 minutes default

class Response(db.Model):
    __tablename__ = 'responses'
    response_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    
    # --- NEW FIELDS FOR WEEK 5 ---
    time_taken_seconds = db.Column(db.Integer, default=0)
    code_snippet = db.Column(db.Text, nullable=True) # For coding rounds
    code_output = db.Column(db.Text, nullable=True) # Output from Piston API
    test_cases_passed = db.Column(db.Integer, default=0)

class Feedback(db.Model):
    __tablename__ = 'feedback'
    feedback_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    technical_score = db.Column(db.Integer)
    behavioral_score = db.Column(db.Integer)
    strengths = db.Column(db.Text)
    weaknesses = db.Column(db.Text)
    career_recommendations = db.Column(db.Text)