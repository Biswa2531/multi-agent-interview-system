import os
from dotenv import load_dotenv

# Load environment variables from the .env file (for local development)
load_dotenv()

class Config:
    # 1. Enforce SECRET_KEY from environment variables (NO fallback)
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("No SECRET_KEY set for Flask application. Did you forget to set the environment variable?")
    
    # 2. Enforce DATABASE_URL from environment variables (NO fallback)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if not DATABASE_URL:
        raise ValueError("No DATABASE_URL set for Flask application. Did you forget to set the environment variable?")

    # SQLAlchemy Configuration
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 3. API Keys
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY')