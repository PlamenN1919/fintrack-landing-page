"""
FinTrack Analytics Database Models
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Index, Float
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import func
import uuid

Base = declarative_base()


class PageVisit(Base):
    """Page visit tracking model"""
    __tablename__ = 'page_visits'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    ip_address_hash = Column(String(64), nullable=False)
    user_agent = Column(Text)
    page_url = Column(String(512), nullable=False, index=True)
    referrer = Column(String(512))
    country_code = Column(String(2), index=True)
    
    # Device information
    device_type = Column(String(20), index=True)  # mobile, tablet, desktop
    os_name = Column(String(50), index=True)  # iOS, Android, Windows, Mac, Linux
    os_version = Column(String(50))
    browser_name = Column(String(50), index=True)  # Chrome, Firefox, Safari, etc
    browser_version = Column(String(50))
    
    # Screen information
    screen_width = Column(Integer)
    screen_height = Column(Integer)
    viewport_width = Column(Integer)
    viewport_height = Column(Integer)
    
    # Time tracking
    time_on_page = Column(Integer)  # seconds
    exit_page = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'page_url': self.page_url,
            'referrer': self.referrer,
            'country_code': self.country_code,
            'device_type': self.device_type,
            'os_name': self.os_name,
            'os_version': self.os_version,
            'browser_name': self.browser_name,
            'browser_version': self.browser_version,
            'screen_width': self.screen_width,
            'screen_height': self.screen_height,
            'time_on_page': self.time_on_page,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ClickEvent(Base):
    """Click event tracking model"""
    __tablename__ = 'click_events'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    button_id = Column(String(255), nullable=False, index=True)
    button_text = Column(String(255))
    page_url = Column(String(512), nullable=False)
    ip_address_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'button_id': self.button_id,
            'button_text': self.button_text,
            'page_url': self.page_url,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ActiveSession(Base):
    """Active session tracking model"""
    __tablename__ = 'active_sessions'
    
    session_id = Column(UUID(as_uuid=True), primary_key=True)
    last_seen = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    page_url = Column(String(512))
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'session_id': str(self.session_id),
            'last_seen': self.last_seen.isoformat() if self.last_seen else None,
            'page_url': self.page_url
        }


class CookieConsent(Base):
    """Cookie consent tracking model (GDPR)"""
    __tablename__ = 'cookie_consents'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, unique=True, index=True)
    consent_given = Column(Boolean, nullable=False, default=False)
    ip_address_hash = Column(String(64), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'consent_given': self.consent_given,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ClickHeatmap(Base):
    """Click heatmap tracking model"""
    __tablename__ = 'click_heatmap'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    page_url = Column(String(512), nullable=False, index=True)
    
    # Click coordinates
    x_position = Column(Integer, nullable=False, index=True)
    y_position = Column(Integer, nullable=False, index=True)
    
    # Viewport dimensions
    viewport_width = Column(Integer, nullable=False)
    viewport_height = Column(Integer, nullable=False)
    
    # Element information
    element_selector = Column(String(512))
    element_text = Column(String(255))
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'page_url': self.page_url,
            'x_position': self.x_position,
            'y_position': self.y_position,
            'viewport_width': self.viewport_width,
            'viewport_height': self.viewport_height,
            'element_selector': self.element_selector,
            'element_text': self.element_text,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ConversionEvent(Base):
    """Conversion funnel tracking model"""
    __tablename__ = 'conversion_events'
    
    id = Column(Integer, primary_key=True)
    session_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    event_name = Column(String(100), nullable=False, index=True)
    event_order = Column(Integer, nullable=False)
    page_url = Column(String(512), nullable=False)
    event_data = Column(Text)  # JSON data for additional context
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'event_name': self.event_name,
            'event_order': self.event_order,
            'page_url': self.page_url,
            'event_data': self.event_data,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


# Helper functions for common queries

def get_visits_count(db_session, hours=24):
    """Get total visits in last N hours"""
    since = datetime.utcnow() - timedelta(hours=hours)
    return db_session.query(func.count(PageVisit.id)).filter(
        PageVisit.created_at >= since
    ).scalar()


def get_clicks_count(db_session, hours=24):
    """Get total clicks in last N hours"""
    since = datetime.utcnow() - timedelta(hours=hours)
    return db_session.query(func.count(ClickEvent.id)).filter(
        ClickEvent.created_at >= since
    ).scalar()


def get_active_users_count(db_session, minutes=5):
    """Get active users in last N minutes"""
    since = datetime.utcnow() - timedelta(minutes=minutes)
    return db_session.query(func.count(ActiveSession.session_id)).filter(
        ActiveSession.last_seen >= since
    ).scalar()


def get_top_clicked_buttons(db_session, limit=10, days=30):
    """Get top clicked buttons"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        ClickEvent.button_id,
        ClickEvent.button_text,
        func.count(ClickEvent.id).label('click_count')
    ).filter(
        ClickEvent.created_at >= since
    ).group_by(
        ClickEvent.button_id,
        ClickEvent.button_text
    ).order_by(
        func.count(ClickEvent.id).desc()
    ).limit(limit).all()


def get_visits_by_day(db_session, days=30):
    """Get visits grouped by day"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        func.date(PageVisit.created_at).label('visit_date'),
        func.count(PageVisit.id).label('visit_count')
    ).filter(
        PageVisit.created_at >= since
    ).group_by(
        func.date(PageVisit.created_at)
    ).order_by(
        func.date(PageVisit.created_at).desc()
    ).all()


def get_traffic_sources(db_session, limit=10, days=30):
    """Get traffic sources (referrers)"""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Use CASE to handle NULL/empty referrers
    from sqlalchemy import case
    
    source = case(
        (PageVisit.referrer == None, 'Direct'),
        (PageVisit.referrer == '', 'Direct'),
        else_=PageVisit.referrer
    ).label('source')
    
    return db_session.query(
        source,
        func.count(PageVisit.id).label('visit_count')
    ).filter(
        PageVisit.created_at >= since
    ).group_by(
        source
    ).order_by(
        func.count(PageVisit.id).desc()
    ).limit(limit).all()


def get_device_stats(db_session, days=30):
    """Get device type statistics"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        PageVisit.device_type,
        func.count(PageVisit.id).label('count')
    ).filter(
        PageVisit.created_at >= since,
        PageVisit.device_type.isnot(None)
    ).group_by(
        PageVisit.device_type
    ).order_by(
        func.count(PageVisit.id).desc()
    ).all()


def get_os_stats(db_session, days=30):
    """Get operating system statistics"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        PageVisit.os_name,
        func.count(PageVisit.id).label('count')
    ).filter(
        PageVisit.created_at >= since,
        PageVisit.os_name.isnot(None)
    ).group_by(
        PageVisit.os_name
    ).order_by(
        func.count(PageVisit.id).desc()
    ).all()


def get_browser_stats(db_session, days=30):
    """Get browser statistics"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        PageVisit.browser_name,
        func.count(PageVisit.id).label('count')
    ).filter(
        PageVisit.created_at >= since,
        PageVisit.browser_name.isnot(None)
    ).group_by(
        PageVisit.browser_name
    ).order_by(
        func.count(PageVisit.id).desc()
    ).all()


def get_geographic_stats(db_session, limit=10, days=30):
    """Get geographic statistics by country"""
    since = datetime.utcnow() - timedelta(days=days)
    return db_session.query(
        PageVisit.country_code,
        func.count(PageVisit.id).label('visit_count')
    ).filter(
        PageVisit.created_at >= since,
        PageVisit.country_code.isnot(None)
    ).group_by(
        PageVisit.country_code
    ).order_by(
        func.count(PageVisit.id).desc()
    ).limit(limit).all()


def get_average_time_on_page(db_session, days=30):
    """Get average time spent on page"""
    since = datetime.utcnow() - timedelta(days=days)
    result = db_session.query(
        func.avg(PageVisit.time_on_page).label('avg_time')
    ).filter(
        PageVisit.created_at >= since,
        PageVisit.time_on_page.isnot(None),
        PageVisit.time_on_page > 0
    ).scalar()
    
    return int(result) if result else 0


def get_heatmap_data(db_session, page_url=None, days=7):
    """Get heatmap click data"""
    since = datetime.utcnow() - timedelta(days=days)
    query = db_session.query(ClickHeatmap).filter(
        ClickHeatmap.created_at >= since
    )
    
    if page_url:
        query = query.filter(ClickHeatmap.page_url == page_url)
    
    return query.order_by(ClickHeatmap.created_at.desc()).limit(1000).all()


def get_conversion_funnel_stats(db_session, days=30):
    """Get conversion funnel statistics"""
    since = datetime.utcnow() - timedelta(days=days)
    
    # Get all conversion events grouped by event_name
    events = db_session.query(
        ConversionEvent.event_name,
        func.count(func.distinct(ConversionEvent.session_id)).label('unique_sessions')
    ).filter(
        ConversionEvent.created_at >= since
    ).group_by(
        ConversionEvent.event_name
    ).order_by(
        func.min(ConversionEvent.event_order)
    ).all()
    
    return events

