"""
FinTrack Analytics Backend
Flask API with WebSocket support
"""
import os
import hashlib
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from werkzeug.middleware.proxy_fix import ProxyFix
import uuid

# Import local modules
from config import get_config
from models import (
    Base, PageVisit, ClickEvent, ActiveSession, CookieConsent,
    get_visits_count, get_clicks_count, get_active_users_count,
    get_top_clicked_buttons, get_visits_by_day, get_traffic_sources
)
from auth import login_required, login_admin, logout_admin, is_authenticated

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(get_config())
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Initialize extensions
CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins=app.config['CORS_ORIGINS'])
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[app.config['RATELIMIT_DEFAULT']],
    storage_uri=app.config['RATELIMIT_STORAGE_URL']
)

# Database setup
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], **app.config['SQLALCHEMY_ENGINE_OPTIONS'])
db_session = scoped_session(sessionmaker(bind=engine))

# Create tables
Base.metadata.create_all(engine)


# Utility functions

def anonymize_ip(ip_address: str) -> str:
    """Anonymize IP address using SHA256 hash (GDPR compliant)"""
    if not app.config['IP_ANONYMIZATION']:
        return ip_address
    return hashlib.sha256(ip_address.encode()).hexdigest()


def get_client_ip() -> str:
    """Get client IP address"""
    if request.headers.get('X-Forwarded-For'):
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    return request.remote_addr or 'unknown'


def cleanup_old_sessions():
    """Remove inactive sessions"""
    timeout = datetime.utcnow() - timedelta(minutes=app.config['ACTIVE_SESSION_TIMEOUT_MINUTES'])
    db_session.query(ActiveSession).filter(ActiveSession.last_seen < timeout).delete()
    db_session.commit()


# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    })


@app.route('/api/track/visit', methods=['POST'])
@limiter.limit("100/minute")
def track_visit():
    """Track page visit"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'session_id' not in data or 'page_url' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check GDPR consent if enabled
        if app.config['GDPR_ENABLED']:
            consent = data.get('consent_given', False)
            if not consent:
                return jsonify({'error': 'GDPR consent required'}), 403
        
        # Create page visit record
        visit = PageVisit(
            session_id=uuid.UUID(data['session_id']),
            ip_address_hash=anonymize_ip(get_client_ip()),
            user_agent=request.headers.get('User-Agent', ''),
            page_url=data['page_url'],
            referrer=data.get('referrer', ''),
            country_code=data.get('country_code')
        )
        
        db_session.add(visit)
        
        # Update active session
        active_session = db_session.query(ActiveSession).filter_by(
            session_id=uuid.UUID(data['session_id'])
        ).first()
        
        if active_session:
            active_session.last_seen = datetime.utcnow()
            active_session.page_url = data['page_url']
        else:
            active_session = ActiveSession(
                session_id=uuid.UUID(data['session_id']),
                page_url=data['page_url']
            )
            db_session.add(active_session)
        
        db_session.commit()
        
        # Broadcast to WebSocket clients
        socketio.emit('new_visit', {
            'session_id': data['session_id'],
            'page_url': data['page_url'],
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        return jsonify({'success': True, 'id': visit.id}), 201
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking visit: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/track/click', methods=['POST'])
@limiter.limit("100/minute")
def track_click():
    """Track button click"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'session_id' not in data or 'button_id' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check GDPR consent if enabled
        if app.config['GDPR_ENABLED']:
            consent = data.get('consent_given', False)
            if not consent:
                return jsonify({'error': 'GDPR consent required'}), 403
        
        # Create click event record
        click = ClickEvent(
            session_id=uuid.UUID(data['session_id']),
            button_id=data['button_id'],
            button_text=data.get('button_text', ''),
            page_url=data.get('page_url', ''),
            ip_address_hash=anonymize_ip(get_client_ip())
        )
        
        db_session.add(click)
        db_session.commit()
        
        # Broadcast to WebSocket clients
        socketio.emit('new_click', {
            'button_id': data['button_id'],
            'button_text': data.get('button_text', ''),
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        return jsonify({'success': True, 'id': click.id}), 201
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking click: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/track/consent', methods=['POST'])
@limiter.limit("20/minute")
def track_consent():
    """Track cookie consent (GDPR)"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data:
            return jsonify({'error': 'Missing session_id'}), 400
        
        # Check if consent already exists
        existing = db_session.query(CookieConsent).filter_by(
            session_id=uuid.UUID(data['session_id'])
        ).first()
        
        if existing:
            existing.consent_given = data.get('consent_given', False)
        else:
            consent = CookieConsent(
                session_id=uuid.UUID(data['session_id']),
                consent_given=data.get('consent_given', False),
                ip_address_hash=anonymize_ip(get_client_ip())
            )
            db_session.add(consent)
        
        db_session.commit()
        return jsonify({'success': True}), 200
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking consent: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# Admin Authentication Routes

@app.route('/api/auth/login', methods=['POST'])
@limiter.limit("5/minute")
def login():
    """Admin login"""
    try:
        data = request.get_json()
        
        if not data or 'password' not in data:
            return jsonify({'error': 'Password required'}), 400
        
        if login_admin(data['password'], app.config['ADMIN_PASSWORD_HASH']):
            return jsonify({
                'success': True,
                'message': 'Успешен вход'
            }), 200
        else:
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Грешна парола'
            }), 401
            
    except Exception as e:
        app.logger.error(f"Error during login: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Admin logout"""
    logout_admin()
    return jsonify({'success': True, 'message': 'Успешен изход'}), 200


@app.route('/api/auth/check', methods=['GET'])
def check_auth():
    """Check if user is authenticated"""
    return jsonify({
        'authenticated': is_authenticated()
    }), 200


# Admin Dashboard Routes (Protected)

@app.route('/api/stats/summary', methods=['GET'])
@login_required
def get_summary_stats():
    """Get summary statistics for dashboard"""
    try:
        # Cleanup old sessions first
        cleanup_old_sessions()
        
        stats = {
            'visits_24h': get_visits_count(db_session, hours=24),
            'clicks_24h': get_clicks_count(db_session, hours=24),
            'active_users': get_active_users_count(db_session, minutes=5),
            'visits_7d': get_visits_count(db_session, hours=24*7),
            'clicks_7d': get_clicks_count(db_session, hours=24*7),
        }
        
        # Calculate conversion rate (clicks / visits)
        if stats['visits_24h'] > 0:
            stats['conversion_rate'] = round((stats['clicks_24h'] / stats['visits_24h']) * 100, 2)
        else:
            stats['conversion_rate'] = 0
        
        return jsonify(stats), 200
        
    except Exception as e:
        app.logger.error(f"Error getting summary stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/stats/chart-data', methods=['GET'])
@login_required
def get_chart_data():
    """Get data for charts"""
    try:
        data = {
            'visits_by_day': [
                {'date': str(row.visit_date), 'count': row.visit_count}
                for row in get_visits_by_day(db_session, days=30)
            ],
            'top_buttons': [
                {
                    'button_id': row.button_id,
                    'button_text': row.button_text,
                    'click_count': row.click_count
                }
                for row in get_top_clicked_buttons(db_session, limit=10, days=30)
            ],
            'traffic_sources': [
                {'source': row.source, 'count': row.visit_count}
                for row in get_traffic_sources(db_session, limit=10, days=30)
            ]
        }
        
        return jsonify(data), 200
        
    except Exception as e:
        app.logger.error(f"Error getting chart data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/events/recent', methods=['GET'])
@login_required
def get_recent_events():
    """Get recent events (visits + clicks)"""
    try:
        limit = min(int(request.args.get('limit', 50)), 100)
        event_type = request.args.get('type', 'all')  # all, visits, clicks
        
        events = []
        
        # Get recent visits
        if event_type in ['all', 'visits']:
            visits = db_session.query(PageVisit).order_by(
                PageVisit.created_at.desc()
            ).limit(limit if event_type == 'visits' else limit // 2).all()
            
            for visit in visits:
                events.append({
                    'type': 'visit',
                    'id': visit.id,
                    'session_id': str(visit.session_id),
                    'page_url': visit.page_url,
                    'referrer': visit.referrer,
                    'created_at': visit.created_at.isoformat()
                })
        
        # Get recent clicks
        if event_type in ['all', 'clicks']:
            clicks = db_session.query(ClickEvent).order_by(
                ClickEvent.created_at.desc()
            ).limit(limit if event_type == 'clicks' else limit // 2).all()
            
            for click in clicks:
                events.append({
                    'type': 'click',
                    'id': click.id,
                    'session_id': str(click.session_id),
                    'button_id': click.button_id,
                    'button_text': click.button_text,
                    'page_url': click.page_url,
                    'created_at': click.created_at.isoformat()
                })
        
        # Sort by timestamp
        events.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify(events[:limit]), 200
        
    except Exception as e:
        app.logger.error(f"Error getting recent events: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


# WebSocket Events

@socketio.on('connect')
def handle_connect():
    """Handle WebSocket connection"""
    if not is_authenticated():
        return False  # Reject connection
    app.logger.info('Admin client connected')


@socketio.on('disconnect')
def handle_disconnect():
    """Handle WebSocket disconnection"""
    app.logger.info('Admin client disconnected')


@socketio.on('ping')
def handle_ping():
    """Handle ping for keep-alive"""
    emit('pong', {'timestamp': datetime.utcnow().isoformat()})


# Background task to update active users count
def broadcast_active_users():
    """Broadcast active users count every 30 seconds"""
    while True:
        socketio.sleep(30)
        try:
            cleanup_old_sessions()
            count = get_active_users_count(db_session, minutes=5)
            socketio.emit('active_users_update', {
                'count': count,
                'timestamp': datetime.utcnow().isoformat()
            }, namespace='/')
        except Exception as e:
            app.logger.error(f"Error broadcasting active users: {str(e)}")


# Start background task
socketio.start_background_task(broadcast_active_users)


# Cleanup on shutdown
@app.teardown_appcontext
def shutdown_session(exception=None):
    """Remove database session on shutdown"""
    db_session.remove()


# Error handlers

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    db_session.rollback()
    return jsonify({'error': 'Internal server error'}), 500


# Run application
if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=app.config['DEBUG'])

