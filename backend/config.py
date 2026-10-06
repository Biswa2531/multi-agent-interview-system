import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class Config:
    # 1. SECRET KEY: Required for JWT Authentication (Login/Signup)
    SECRET_KEY = os.getenv('SECRET_KEY', 'super-secret-key-for-jwt-2026')
    
    # 2. DATABASE: Pointing to PostgreSQL (as per Week 4 migration)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql+psycopg2://postgres:postgre123@localhost:5432/interview_system')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 3. API Keys (Fixed the variable name here!)
    GROQ_API_KEY = os.getenv('GROQ_API_KEY')