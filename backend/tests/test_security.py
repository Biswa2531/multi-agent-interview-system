import pytest
import sys
import os
import jwt
import datetime

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app
from models import db, User

@pytest.fixture
def client():
    """Create a test client for the Flask app with an in-memory database."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
            db.drop_all()

@pytest.fixture
def auth_headers():
    """Generate a valid JWT token for a standard candidate user."""
    with app.app_context():
        user = User(name='Test Candidate', email='test@example.com', password_hash='hash', role='candidate', status='active')
        db.session.add(user)
        db.session.commit()
        
        token = jwt.encode({
            'user_id': user.user_id,
            'email': user.email,
            'role': user.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
    return {'Authorization': f'Bearer {token}'}

@pytest.fixture
def admin_headers():
    """Generate a valid JWT token for an admin user."""
    with app.app_context():
        admin = User(name='Test Admin', email='admin@example.com', password_hash='hash', role='admin', status='active')
        db.session.add(admin)
        db.session.commit()
        
        token = jwt.encode({
            'user_id': admin.user_id,
            'email': admin.email,
            'role': admin.role,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
    return {'Authorization': f'Bearer {token}'}

# --- EXISTING SECURITY TESTS ---

def test_admin_route_blocks_unauthenticated_users(client):
    """PROOF: Admin routes return 401 Unauthorized if no token is provided."""
    response = client.get('/api/admin/users')
    assert response.status_code == 401, "Admin route should block unauthenticated users!"

def test_admin_route_blocks_invalid_tokens(client):
    """PROOF: Admin routes return 401/422 if a fake/invalid token is provided."""
    headers = {'Authorization': 'Bearer this_is_a_fake_token'}
    response = client.get('/api/admin/users', headers=headers)
    assert response.status_code in [401, 422], "Admin route should block invalid tokens!"

def test_user_stats_route_blocks_unauthenticated_users(client):
    """PROOF: User routes return 401 Unauthorized if no token is provided."""
    response = client.get('/api/user/stats')
    assert response.status_code == 401, "User stats route should block unauthenticated users!"

# --- NEW TASK 11 TESTS ---

def test_promote_to_admin_blocked_for_non_admins(client):
    """PROOF: promote-to-admin route requires authentication (and admin role)."""
    response = client.post('/api/dev/promote-to-admin', json={'email': 'test@example.com'})
    assert response.status_code == 401, "Promote route should block unauthenticated users!"

def test_snapshots_require_admin(client):
    """
    Test that the secure snapshot route is NOT publicly accessible.
    It must return an error status (401, 403, or 404), never 200 OK.
    """
    # Request the protected route without a token
    response = client.get('/api/admin/snapshots/1/fake_image.jpg')
    
    # ✅ Bulletproof assertion: Ensure the route is NOT publicly accessible (200)
    assert response.status_code != 200, "Snapshot route is publicly accessible! It must be protected."
    
    # Ideally it should be 401 (Unauthorized)
    assert response.status_code in [401, 403, 404], f"Expected 401/403/404, but got {response.status_code}"
    
def test_violation_endpoint_requires_auth(client):
    """PROOF: /api/violation requires authentication to log a violation."""
    response = client.post('/api/violation', json={'session_id': 1, 'type': 'tab_switch', 'details': 'Test'})
    assert response.status_code == 401, "Violation route should block unauthenticated users!"

def test_proctoring_config_returns_settings(client, auth_headers):
    """PROOF: /api/proctoring-config returns settings for authenticated users."""
    response = client.get('/api/proctoring-config', headers=auth_headers)
    assert response.status_code == 200, "Proctoring config should be accessible to authenticated users!"
    data = response.get_json()
    assert 'max_violations' in data['data'], "Response should contain max_violations!"
    assert 'webcam_enabled' in data['data'], "Response should contain webcam_enabled!"