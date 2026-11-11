from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='candidate')
    status = db.Column(db.String(20), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Item 11: Cascade Deletes
    sessions = db.relationship('InterviewSession', backref='user', cascade="all, delete-orphan", lazy=True)
    responses = db.relationship('Response', backref='user', cascade="all, delete-orphan", lazy=True)
    feedbacks = db.relationship('Feedback', backref='user', cascade="all, delete-orphan", lazy=True)
    violations = db.relationship('Violation', backref='user', cascade="all, delete-orphan", lazy=True)

class InterviewSession(db.Model):
    __tablename__ = 'interview_sessions'
    session_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    job_role = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='in_progress')
    started_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)

    questions = db.relationship('Question', backref='session', cascade="all, delete-orphan", lazy=True)
    feedback = db.relationship('Feedback', backref='session', uselist=False, cascade="all, delete-orphan", lazy=True)
    violations = db.relationship('Violation', backref='session', cascade="all, delete-orphan", lazy=True)
    snapshots = db.relationship('Snapshot', backref='session', cascade="all, delete-orphan", lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    question_id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    question_text = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))
    difficulty = db.Column(db.String(20))
    responses = db.relationship('Response', backref='question', cascade="all, delete-orphan", lazy=True)

class Response(db.Model):
    __tablename__ = 'responses'
    response_id = db.Column(db.Integer, primary_key=True)
    question_id = db.Column(db.Integer, db.ForeignKey('questions.question_id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    answer_text = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

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
    admin_override = db.Column(db.Boolean, default=False)

class Violation(db.Model):
    __tablename__ = 'violations'
    violation_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    violation_type = db.Column(db.String(50))
    description = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class Snapshot(db.Model):
    __tablename__ = 'snapshots'
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('interview_sessions.session_id'), nullable=False)
    image_path = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

class ProctoringConfig(db.Model):
    __tablename__ = 'proctoring_config'
    id = db.Column(db.Integer, primary_key=True, default=1)
    max_violations = db.Column(db.Integer, default=3)
    webcam_enabled = db.Column(db.Boolean, default=True)

# Item 1: Secure Database-backed OTP Table
class OTPCode(db.Model):
    __tablename__ = 'otp_codes'
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), nullable=False, index=True)
    code_hash = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(20), nullable=False) # signup, login, forgot
    payload = db.Column(db.Text, nullable=True) # JSON string for extra data
    expires_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)