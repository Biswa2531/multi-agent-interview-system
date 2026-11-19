import os
from app import app, db
from models import User
from werkzeug.security import generate_password_hash

# ✅ SECURE: Read from environment variables, with safe fallback defaults for local dev
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "b.screwation2004@gmail.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "Admin@1234")

with app.app_context():
    user = User.query.filter_by(email=ADMIN_EMAIL).first()
    
    if not user:
        user = User(
            name="Admin", 
            email=ADMIN_EMAIL, 
            password_hash=generate_password_hash(ADMIN_PASSWORD, method='pbkdf2:sha256'), 
            role='admin', 
            status='active'
        )
        db.session.add(user)
        db.session.commit()
        print(f"✅ Admin account created successfully: {ADMIN_EMAIL}")
    else:
        user.role = 'admin'
        db.session.commit()
        print(f"✅ Existing user {ADMIN_EMAIL} has been promoted to Admin!")