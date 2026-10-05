from app import app
from models import db

with app.app_context():
    print("Updating database tables...")
    
    # Add new columns to the 'questions' table
    db.session.execute(db.text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS round_type VARCHAR(50) DEFAULT 'Conceptual'"))
    db.session.execute(db.text("ALTER TABLE questions ADD COLUMN IF NOT EXISTS time_limit_seconds INTEGER DEFAULT 180"))
    
    # Add new columns to the 'responses' table
    db.session.execute(db.text("ALTER TABLE responses ADD COLUMN IF NOT EXISTS time_taken_seconds INTEGER DEFAULT 0"))
    db.session.execute(db.text("ALTER TABLE responses ADD COLUMN IF NOT EXISTS code_snippet TEXT"))
    db.session.execute(db.text("ALTER TABLE responses ADD COLUMN IF NOT EXISTS code_output TEXT"))
    db.session.execute(db.text("ALTER TABLE responses ADD COLUMN IF NOT EXISTS test_cases_passed INTEGER DEFAULT 0"))
    
    # Save the changes
    db.session.commit()
    print("✅ Database tables updated successfully with new columns!")