"""
FinTrack Analytics Authentication
Simple password-based authentication for admin panel
"""
import bcrypt
from functools import wraps
from flask import session, request, jsonify


def hash_password(password: str) -> str:
    """Hash a password for storing"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def check_password(password: str, hashed: str) -> bool:
    """Verify a password against a hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def login_required(f):
    """Decorator to require login for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('admin_logged_in'):
            return jsonify({
                'error': 'Unauthorized',
                'message': 'Моля, влезте в системата'
            }), 401
        return f(*args, **kwargs)
    return decorated_function


def login_admin(password: str, admin_password_hash: str) -> bool:
    """
    Login admin user
    Returns True if successful, False otherwise
    """
    if check_password(password, admin_password_hash):
        session.permanent = True
        session['admin_logged_in'] = True
        return True
    return False


def logout_admin():
    """Logout admin user"""
    session.pop('admin_logged_in', None)
    session.clear()


def is_authenticated() -> bool:
    """Check if user is authenticated"""
    return session.get('admin_logged_in', False)


# Utility to generate password hash (for setup)
if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        password = sys.argv[1]
        hashed = hash_password(password)
        print(f"Password: {password}")
        print(f"Hash: {hashed}")
        print("\nAdd this to your .env file:")
        print(f"ADMIN_PASSWORD_HASH={hashed}")
    else:
        print("Usage: python auth.py <password>")
        print("Example: python auth.py mySecurePassword123")

