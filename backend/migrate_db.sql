-- ===================================
-- FINTRACK ANALYTICS DATABASE MIGRATION
-- Migration script to add new columns and tables
-- ===================================

-- Add new columns to page_visits table
ALTER TABLE page_visits 
ADD COLUMN IF NOT EXISTS device_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS os_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS os_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS browser_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS browser_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS screen_width INTEGER,
ADD COLUMN IF NOT EXISTS screen_height INTEGER,
ADD COLUMN IF NOT EXISTS viewport_width INTEGER,
ADD COLUMN IF NOT EXISTS viewport_height INTEGER,
ADD COLUMN IF NOT EXISTS time_on_page INTEGER,
ADD COLUMN IF NOT EXISTS exit_page BOOLEAN DEFAULT FALSE;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_pv_device_type ON page_visits(device_type);
CREATE INDEX IF NOT EXISTS idx_pv_os_name ON page_visits(os_name);
CREATE INDEX IF NOT EXISTS idx_pv_browser_name ON page_visits(browser_name);
CREATE INDEX IF NOT EXISTS idx_pv_country_code ON page_visits(country_code);

-- Create click_heatmap table
CREATE TABLE IF NOT EXISTS click_heatmap (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    page_url VARCHAR(512) NOT NULL,
    x_position INTEGER NOT NULL,
    y_position INTEGER NOT NULL,
    viewport_width INTEGER NOT NULL,
    viewport_height INTEGER NOT NULL,
    element_selector VARCHAR(512),
    element_text VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for click_heatmap
CREATE INDEX IF NOT EXISTS idx_ch_session_id ON click_heatmap(session_id);
CREATE INDEX IF NOT EXISTS idx_ch_page_url ON click_heatmap(page_url);
CREATE INDEX IF NOT EXISTS idx_ch_created_at ON click_heatmap(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ch_coordinates ON click_heatmap(x_position, y_position);

-- Create conversion_events table
CREATE TABLE IF NOT EXISTS conversion_events (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    event_name VARCHAR(100) NOT NULL,
    event_order INTEGER NOT NULL,
    page_url VARCHAR(512) NOT NULL,
    event_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for conversion_events
CREATE INDEX IF NOT EXISTS idx_conv_session_id ON conversion_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conv_event_name ON conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_conv_created_at ON conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conv_event_order ON conversion_events(event_order);

-- Update cleanup function
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
    
    -- Delete click heatmap data older than 90 days
    DELETE FROM click_heatmap 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete conversion events older than 90 days
    DELETE FROM conversion_events 
    WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '90 days';
    
    -- Delete inactive sessions (older than 30 minutes)
    DELETE FROM active_sessions 
    WHERE last_seen < CURRENT_TIMESTAMP - INTERVAL '30 minutes';
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Migration completed successfully!' AS status;

