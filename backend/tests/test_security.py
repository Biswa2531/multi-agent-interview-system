import pytest
import sys
import os

# Ensure the backend directory is in the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app import app

@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

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