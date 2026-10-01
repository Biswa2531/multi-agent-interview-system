from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Table 1: Users
class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='candidate')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Table 2: Interview Sessions
class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    session_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    job_role = db.Column(db.String(100), nullable=False)
    experience_level = db.Column(db.String(50))
    status = db.Column(db.String(20), default='pending')
    started_at = db.Column(db.DateTime, default=datetime.utcnow)

# Table 3: Questions
class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))

# Table 4: Responses
class Response(db.Model):
    __tablename__ = 'responses'
    response_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    answer_text = db.Column(db.Text, nullable=False)
    submitted_at = db.Column(db.DateTime, default=datetime.utcnow)

# Table 5: Feedback
class Feedback(db.Model):
    __tablename__ = 'feedback'
    feedback_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    technical_score = db.Column(db.Float)
    behavioral_score = db.Column(db.Float)
    strengths = db.Column(db.Text)
    weaknesses = db.Column(db.Text)
    career_recommendations = db.Column(db.Text)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)