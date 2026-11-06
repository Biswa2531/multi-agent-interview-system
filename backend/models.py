from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), default='candidate')
    status = db.Column(db.String(20), default='active') # NEW: For blocking users
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

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
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(50))

class Response(db.Model):
    __tablename__ = 'responses'
    response_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Feedback(db.Model):
    __tablename__ = 'feedback'
    feedback_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    technical_score = db.Column(db.Integer)
    behavioral_score = db.Column(db.Integer)
    strengths = db.Column(db.Text)
    weaknesses = db.Column(db.Text)
    career_recommendations = db.Column(db.Text)
    admin_override = db.Column(db.Boolean, default=False) # NEW LINE
    
class Violation(db.Model):
    __tablename__ = 'violations'
    violation_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    violation_type = db.Column(db.String(50), nullable=False)  # e.g., 'Tab Switch', 'Webcam Off'
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    description = db.Column(db.Text)