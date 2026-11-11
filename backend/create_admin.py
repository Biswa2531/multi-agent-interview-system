from app import app, db
from models import User
from werkzeug.security import generate_password_hash

with app.app_context():
    # CHANGE THIS TO YOUR EMAIL
    email = "b.screation2004@gmail.com" 
    password = "biswacaptures"
    
    user = User.query.filter_by(email=email).first()
    
    if not user:
        user = User(
            name="Admin", 
            email=email, 
            password_hash=generate_password_hash(password, method='pbkdf2:sha256'), 
            role='admin', 
            status='active'
        )
        db.session.add(user)
        db.session.commit()
        print(f"✅ Admin account created successfully: {email}")
    else:
        user.role = 'admin'
        db.session.commit()
        print(f"✅ Existing user {email} has been promoted to Admin!")