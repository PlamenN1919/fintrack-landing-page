"""
FinTrack Analytics Backend
Flask API with WebSocket support
"""
import os
import hashlib
import json
import csv
import io
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from werkzeug.middleware.proxy_fix import ProxyFix
import uuid
from user_agents import parse as parse_user_agent

# Import local modules
from config import get_config
from models import (
    Base, PageVisit, ClickEvent, ActiveSession, CookieConsent, ClickHeatmap, ConversionEvent,
    get_visits_count, get_clicks_count, get_active_users_count,
    get_top_clicked_buttons, get_visits_by_day, get_traffic_sources,
    get_device_stats, get_os_stats, get_browser_stats, get_geographic_stats,
    get_average_time_on_page, get_heatmap_data, get_conversion_funnel_stats
)
from auth import login_required, login_admin, logout_admin, is_authenticated

# Initialize Flask app
app = Flask(__name__)
app.config.from_object(get_config())
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

# Initialize extensions
CORS(app, origins=app.config['CORS_ORIGINS'], supports_credentials=True)
socketio = SocketIO(app, cors_allowed_origins=app.config['CORS_ORIGINS'], async_mode='threading')
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=[app.config['RATELIMIT_DEFAULT']],
    storage_uri=app.config['RATELIMIT_STORAGE_URL']
)

# Database setup
engine = create_engine(app.config['SQLALCHEMY_DATABASE_URI'], **app.config['SQLALCHEMY_ENGINE_OPTIONS'])
db_session = scoped_session(sessionmaker(bind=engine))

# Create tables (with error handling)
try:
    Base.metadata.create_all(engine)
    print("✅ Database tables created successfully")
except Exception as e:
    print(f"⚠️ Warning: Could not create tables: {e}")
    print("Tables may already exist or will be created on first request")


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


def parse_device_info(user_agent_string):
    """Parse user agent string to extract device information"""
    try:
        ua = parse_user_agent(user_agent_string)
        
        # Determine device type
        if ua.is_mobile:
            device_type = 'mobile'
        elif ua.is_tablet:
            device_type = 'tablet'
        elif ua.is_pc:
            device_type = 'desktop'
        else:
            device_type = 'unknown'
        
        # Get OS info
        os_name = ua.os.family if ua.os.family else 'Unknown'
        os_version = ua.os.version_string if ua.os.version_string else ''
        
        # Get browser info
        browser_name = ua.browser.family if ua.browser.family else 'Unknown'
        browser_version = ua.browser.version_string if ua.browser.version_string else ''
        
        return {
            'device_type': device_type,
            'os_name': os_name,
            'os_version': os_version,
            'browser_name': browser_name,
            'browser_version': browser_version
        }
    except Exception as e:
        app.logger.error(f"Error parsing user agent: {str(e)}")
        return {
            'device_type': 'unknown',
            'os_name': 'Unknown',
            'os_version': '',
            'browser_name': 'Unknown',
            'browser_version': ''
        }


# API Routes

@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'FinTrack Analytics Backend',
        'status': 'running',
        'version': '1.0.0'
    })


@app.route('/health', methods=['GET'])
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db_session.execute('SELECT 1')
        db_status = 'connected'
    except:
        db_status = 'disconnected'
    
    return jsonify({
        'status': 'healthy',
        'database': db_status,
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
        
        # Parse device information from user agent
        user_agent_string = request.headers.get('User-Agent', '')
        device_info = parse_device_info(user_agent_string)
        
        # Create page visit record
        visit = PageVisit(
            session_id=uuid.UUID(data['session_id']),
            ip_address_hash=anonymize_ip(get_client_ip()),
            user_agent=user_agent_string,
            page_url=data['page_url'],
            referrer=data.get('referrer', ''),
            country_code=data.get('country_code'),
            # Device info
            device_type=device_info['device_type'],
            os_name=device_info['os_name'],
            os_version=device_info['os_version'],
            browser_name=device_info['browser_name'],
            browser_version=device_info['browser_version'],
            # Screen info
            screen_width=data.get('screen_width'),
            screen_height=data.get('screen_height'),
            viewport_width=data.get('viewport_width'),
            viewport_height=data.get('viewport_height')
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
            'device_type': device_info['device_type'],
            'os_name': device_info['os_name'],
            'browser_name': device_info['browser_name'],
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        # Emit device stats update
        socketio.emit('device_stats_update', {
            'device_type': device_info['device_type'],
            'os_name': device_info['os_name'],
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        # Emit geographic update if country code available
        if data.get('country_code'):
            socketio.emit('geographic_update', {
                'country_code': data.get('country_code'),
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


@app.route('/api/track/page-exit', methods=['POST'])
@limiter.limit("100/minute")
def track_page_exit():
    """Track page exit and time on page"""
    try:
        data = request.get_json()
        
        if not data or 'session_id' not in data or 'page_url' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Find the most recent visit for this session and page
        visit = db_session.query(PageVisit).filter_by(
            session_id=uuid.UUID(data['session_id']),
            page_url=data['page_url']
        ).order_by(PageVisit.created_at.desc()).first()
        
        if visit:
            visit.time_on_page = data.get('time_on_page', 0)
            visit.exit_page = True
            db_session.commit()
            return jsonify({'success': True}), 200
        
        return jsonify({'error': 'Visit not found'}), 404
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking page exit: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/track/heatmap', methods=['POST'])
@limiter.limit("200/minute")
def track_heatmap():
    """Track click coordinates for heatmap"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'session_id' not in data or 'clicks' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check GDPR consent if enabled
        if app.config['GDPR_ENABLED']:
            consent = data.get('consent_given', False)
            if not consent:
                return jsonify({'error': 'GDPR consent required'}), 403
        
        # Batch insert heatmap clicks
        clicks_data = data.get('clicks', [])
        for click_data in clicks_data:
            heatmap_click = ClickHeatmap(
                session_id=uuid.UUID(data['session_id']),
                page_url=click_data.get('page_url', ''),
                x_position=click_data.get('x', 0),
                y_position=click_data.get('y', 0),
                viewport_width=click_data.get('viewport_width', 0),
                viewport_height=click_data.get('viewport_height', 0),
                element_selector=click_data.get('element_selector', ''),
                element_text=click_data.get('element_text', '')
            )
            db_session.add(heatmap_click)
        
        db_session.commit()
        
        # Broadcast to WebSocket clients
        socketio.emit('heatmap_update', {
            'count': len(clicks_data),
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        return jsonify({'success': True, 'count': len(clicks_data)}), 201
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking heatmap: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/track/conversion', methods=['POST'])
@limiter.limit("100/minute")
def track_conversion():
    """Track conversion funnel event"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'session_id' not in data or 'event_name' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Check GDPR consent if enabled
        if app.config['GDPR_ENABLED']:
            consent = data.get('consent_given', False)
            if not consent:
                return jsonify({'error': 'GDPR consent required'}), 403
        
        # Get current event count for this session to determine order
        event_count = db_session.query(ConversionEvent).filter_by(
            session_id=uuid.UUID(data['session_id'])
        ).count()
        
        # Create conversion event
        conversion = ConversionEvent(
            session_id=uuid.UUID(data['session_id']),
            event_name=data['event_name'],
            event_order=event_count + 1,
            page_url=data.get('page_url', ''),
            event_data=json.dumps(data.get('event_data', {}))
        )
        
        db_session.add(conversion)
        db_session.commit()
        
        # Broadcast to WebSocket clients
        socketio.emit('conversion_update', {
            'event_name': data['event_name'],
            'timestamp': datetime.utcnow().isoformat()
        }, namespace='/')
        
        return jsonify({'success': True, 'id': conversion.id}), 201
        
    except Exception as e:
        db_session.rollback()
        app.logger.error(f"Error tracking conversion: {str(e)}")
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
                    'device_type': visit.device_type,
                    'os_name': visit.os_name,
                    'browser_name': visit.browser_name,
                    'country_code': visit.country_code,
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


@app.route('/api/stats/devices', methods=['GET'])
@login_required
def get_device_statistics():
    """Get device statistics"""
    try:
        days = int(request.args.get('days', 30))
        
        device_stats = get_device_stats(db_session, days=days)
        os_stats = get_os_stats(db_session, days=days)
        browser_stats = get_browser_stats(db_session, days=days)
        
        return jsonify({
            'devices': [{'type': row.device_type, 'count': row.count} for row in device_stats],
            'operating_systems': [{'name': row.os_name, 'count': row.count} for row in os_stats],
            'browsers': [{'name': row.browser_name, 'count': row.count} for row in browser_stats]
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting device statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/stats/geographic', methods=['GET'])
@login_required
def get_geographic_statistics():
    """Get geographic statistics"""
    try:
        days = int(request.args.get('days', 30))
        limit = int(request.args.get('limit', 10))
        
        geo_stats = get_geographic_stats(db_session, limit=limit, days=days)
        
        return jsonify({
            'countries': [
                {'country_code': row.country_code, 'count': row.visit_count}
                for row in geo_stats
            ]
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting geographic statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/stats/heatmap', methods=['GET'])
@login_required
def get_heatmap_statistics():
    """Get heatmap data"""
    try:
        page_url = request.args.get('page_url')
        days = int(request.args.get('days', 7))
        
        heatmap_data = get_heatmap_data(db_session, page_url=page_url, days=days)
        
        return jsonify({
            'clicks': [click.to_dict() for click in heatmap_data]
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting heatmap data: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/stats/funnel', methods=['GET'])
@login_required
def get_funnel_statistics():
    """Get conversion funnel statistics"""
    try:
        days = int(request.args.get('days', 30))
        
        funnel_stats = get_conversion_funnel_stats(db_session, days=days)
        
        return jsonify({
            'funnel': [
                {'event_name': row.event_name, 'unique_sessions': row.unique_sessions}
                for row in funnel_stats
            ]
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting funnel statistics: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/stats/time-on-page', methods=['GET'])
@login_required
def get_time_on_page_stats():
    """Get average time on page statistics"""
    try:
        days = int(request.args.get('days', 30))
        
        avg_time = get_average_time_on_page(db_session, days=days)
        
        return jsonify({
            'average_time_seconds': avg_time,
            'average_time_minutes': round(avg_time / 60, 2) if avg_time else 0
        }), 200
        
    except Exception as e:
        app.logger.error(f"Error getting time on page stats: {str(e)}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/export/data', methods=['GET'])
@login_required
def export_data():
    """Export analytics data"""
    try:
        export_format = request.args.get('format', 'csv')  # csv, excel
        days = int(request.args.get('days', 30))
        data_type = request.args.get('type', 'visits')  # visits, clicks, all
        
        since = datetime.utcnow() - timedelta(days=days)
        
        if export_format == 'csv':
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            if data_type in ['visits', 'all']:
                # Export visits
                writer.writerow(['Type', 'Session ID', 'Page URL', 'Referrer', 'Device Type', 
                                'OS', 'Browser', 'Country', 'Time on Page (s)', 'Created At'])
                
                visits = db_session.query(PageVisit).filter(
                    PageVisit.created_at >= since
                ).order_by(PageVisit.created_at.desc()).limit(10000).all()
                
                for visit in visits:
                    writer.writerow([
                        'Visit',
                        str(visit.session_id),
                        visit.page_url,
                        visit.referrer or '',
                        visit.device_type or '',
                        visit.os_name or '',
                        visit.browser_name or '',
                        visit.country_code or '',
                        visit.time_on_page or '',
                        visit.created_at.isoformat()
                    ])
            
            if data_type in ['clicks', 'all']:
                # Export clicks
                if data_type == 'all':
                    writer.writerow([])  # Empty row separator
                    
                writer.writerow(['Type', 'Session ID', 'Button ID', 'Button Text', 
                                'Page URL', 'Created At'])
                
                clicks = db_session.query(ClickEvent).filter(
                    ClickEvent.created_at >= since
                ).order_by(ClickEvent.created_at.desc()).limit(10000).all()
                
                for click in clicks:
                    writer.writerow([
                        'Click',
                        str(click.session_id),
                        click.button_id,
                        click.button_text or '',
                        click.page_url,
                        click.created_at.isoformat()
                    ])
            
            # Create response
            output.seek(0)
            return send_file(
                io.BytesIO(output.getvalue().encode('utf-8')),
                mimetype='text/csv',
                as_attachment=True,
                download_name=f'fintrack_analytics_{data_type}_{datetime.utcnow().strftime("%Y%m%d")}.csv'
            )
        
        elif export_format == 'excel':
            # For Excel export, we would use openpyxl here
            # For now, return CSV with different extension
            return jsonify({'error': 'Excel export coming soon'}), 501
        
        else:
            return jsonify({'error': 'Invalid format'}), 400
        
    except Exception as e:
        app.logger.error(f"Error exporting data: {str(e)}")
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

