-- ===================================
-- FINTRACK LANDING PAGE ANALYTICS
-- PostgreSQL Database Schema
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- TABLE: page_visits
-- Проследяване на посещения на страницата
-- ===================================
CREATE TABLE page_visits (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    ip_address_hash VARCHAR(64) NOT NULL, -- SHA256 hash за GDPR compliance
    user_agent TEXT,
    page_url VARCHAR(512) NOT NULL,
    referrer VARCHAR(512),
    country_code VARCHAR(2), -- ISO 3166-1 alpha-2 (опционално)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes за page_visits
CREATE INDEX idx_pv_session_id ON page_visits(session_id);
CREATE INDEX idx_pv_created_at ON page_visits(created_at DESC);
CREATE INDEX idx_pv_page_url ON page_visits(page_url);

-- ===================================
-- TABLE: click_events
-- Проследяване на кликвания върху бутони
-- ===================================
CREATE TABLE click_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    button_id VARCHAR(255) NOT NULL, -- data-track-id от HTML
    button_text VARCHAR(255),
    page_url VARCHAR(512) NOT NULL,
    ip_address_hash VARCHAR(64) NOT NULL, -- SHA256 hash за GDPR compliance
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes за click_events
CREATE INDEX idx_ce_session_id ON click_events(session_id);
CREATE INDEX idx_ce_button_id ON click_events(button_id);
CREATE INDEX idx_ce_created_at ON click_events(created_at DESC);

-- ===================================
-- TABLE: active_sessions
-- Real-time активни потребители
-- ===================================
CREATE TABLE active_sessions (
    session_id UUID PRIMARY KEY,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    page_url VARCHAR(512)
);

-- Index за active_sessions
CREATE INDEX idx_as_last_seen ON active_sessions(last_seen DESC);

-- ===================================
-- TABLE: cookie_consents (GDPR)
-- Проследяване на cookie съгласия
-- ===================================
CREATE TABLE cookie_consents (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL UNIQUE,
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes за cookie_consents
CREATE INDEX idx_cc_session_id ON cookie_consents(session_id);
CREATE INDEX idx_cc_created_at ON cookie_consents(created_at DESC);

-- ===================================
-- FUNCTION: Cleanup old data (GDPR - 90 days retention)
-- ===================================
CREATE OR REPLACE FUNCTION cleanup_old_analytics_data()
RETURNS void AS $$
BEGIN
    -- Delete page visits older than 90 days
    DELETE FROM page_visits 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete click events older than 90 days
    DELETE FROM click_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete cookie consents older than 90 days
    DELETE FROM cookie_consents 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete inactive sessions (older than 30 minutes)
    DELETE FROM active_sessions 
    WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- SCHEDULED JOB: Run cleanup daily
-- (Note: This requires pg_cron extension or external cron job)
-- ===================================
-- For production, set up a cron job or use pg_cron:
-- SELECT cron.schedule('cleanup-analytics', '0 2 * * *', 'SELECT cleanup_old_analytics_data()');

-- ===================================
-- SAMPLE QUERIES FOR ADMIN DASHBOARD
-- ===================================

-- Get total visits in last 24 hours
-- SELECT COUNT(*) FROM page_visits WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Get total clicks in last 24 hours
-- SELECT COUNT(*) FROM click_events WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours';

-- Get active users (sessions active in last 5 minutes)
-- SELECT COUNT(*) FROM active_sessions WHERE last_seen > CURRENT_TIMESTAMP - INTERVAL '5 minutes';

-- Get top clicked buttons
-- SELECT button_id, button_text, COUNT(*) as click_count 
-- FROM click_events 
-- WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
-- GROUP BY button_id, button_text 
-- ORDER BY click_count DESC 
-- LIMIT 10;

-- Get visits by day (last 30 days)
-- SELECT DATE(created_at) as visit_date, COUNT(*) as visit_count
-- FROM page_visits
-- WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
-- GROUP BY DATE(created_at)
-- ORDER BY visit_date DESC;

-- Get traffic sources (referrers)
-- SELECT 
--     CASE 
--         WHEN referrer IS NULL OR referrer = '' THEN 'Direct'
--         ELSE referrer 
--     END as source,
--     COUNT(*) as visit_count
-- FROM page_visits
-- WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days'
-- GROUP BY source
-- ORDER BY visit_count DESC
-- LIMIT 10;

-- ===================================
-- GRANTS (for production)
-- ===================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO analytics_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO analytics_user;

