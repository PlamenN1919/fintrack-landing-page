"""
FinTrack Analytics Database Models
"""
from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Index
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
    country_code = Column(String(2))
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'session_id': str(self.session_id),
            'page_url': self.page_url,
            'referrer': self.referrer,
            'country_code': self.country_code,
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

