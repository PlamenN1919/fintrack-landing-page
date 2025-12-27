"""
FinTrack Analytics Backend Configuration
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False
    
    # Database (using psycopg2)
    SQLALCHEMY_DATABASE_URI = os.getenv(
        'DATABASE_URL',
        'postgresql://localhost/fintrack_analytics'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 5,
        'max_overflow': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'connect_args': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000'
        }
    }
    
    # CORS
    CORS_ORIGINS = os.getenv(
        'CORS_ORIGINS',
        'http://localhost:3000,http://localhost:5000,http://127.0.0.1:3000,https://fintrackwallet.com,https://www.fintrackwallet.com,https://api.fintrackwallet.com'
    ).split(',')
    
    # Admin Authentication
    ADMIN_PASSWORD_HASH = os.getenv(
        'ADMIN_PASSWORD_HASH',
        # Default: "admin123" - CHANGE IN PRODUCTION!
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5oi2QjP1pJbze'
    )
    
    # Session
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SECURE = os.getenv('FLASK_ENV') == 'production'
    # IMPORTANT: Using 'Lax' for same-site subdomain setup (fintrackwallet.com + api.fintrackwallet.com)
    # This works because both domains share the same eTLD+1 (fintrackwallet.com)
    SESSION_COOKIE_SAMESITE = os.getenv('SESSION_SAMESITE', 'Lax')
    # Set domain to allow cookies across subdomains (fintrackwallet.com and api.fintrackwallet.com)
    SESSION_COOKIE_DOMAIN = os.getenv('SESSION_COOKIE_DOMAIN', '.fintrackwallet.com' if os.getenv('FLASK_ENV') == 'production' else None)
    PERMANENT_SESSION_LIFETIME = timedelta(hours=12)
    
    # Rate Limiting
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = '100/minute'
    
    # Analytics Settings
    DATA_RETENTION_DAYS = int(os.getenv('DATA_RETENTION_DAYS', '90'))
    ACTIVE_SESSION_TIMEOUT_MINUTES = int(os.getenv('ACTIVE_SESSION_TIMEOUT', '5'))
    
    # GDPR
    GDPR_ENABLED = os.getenv('GDPR_ENABLED', 'true').lower() == 'true'
    IP_ANONYMIZATION = os.getenv('IP_ANONYMIZATION', 'true').lower() == 'true'


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SESSION_COOKIE_SECURE = False  # Allow non-HTTPS in development
    SESSION_COOKIE_SAMESITE = 'Lax'  # More permissive for local development
    # Specific origins for development (no wildcard with credentials)
    CORS_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5000', 
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ]


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Force HTTPS in production
    SESSION_COOKIE_SECURE = True
    # Using 'Lax' for same-site subdomain setup (api.fintrackwallet.com)
    # This is more secure than 'None' and works because we use subdomain
    SESSION_COOKIE_SAMESITE = 'Lax'
    # Share cookies across fintrackwallet.com subdomains
    SESSION_COOKIE_DOMAIN = '.fintrackwallet.com'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    RATELIMIT_ENABLED = False


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.getenv('FLASK_ENV', 'development')
    return config.get(env, config['default'])

