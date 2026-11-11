from app import app, db

with app.app_context():
    # Drop all existing tables
    db.drop_all()
    print("✅ All existing tables dropped.")
    
    # Create all tables fresh based on the new models.py
    db.create_all()
    print("✅ Fresh database tables created successfully!")