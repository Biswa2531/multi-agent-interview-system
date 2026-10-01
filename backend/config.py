import os
from dotenv import load_dotenv

# Load environment variables from the .env file
load_dotenv()

class Config:
    # Database configuration (Using SQLite for easy local testing for now)
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///interview.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Keys (We will add these later when we integrate the AI agents)
    OPENROUTER_API_KEY = os.getenv('OPENROUTER_API_KEY')
    GROQ_API_KEY = os.getenv('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')