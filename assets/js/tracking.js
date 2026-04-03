/**
 * FinTrack Analytics Tracking Script
 * Universal event tracking with GDPR compliance
 */

(function() {
    'use strict';
    
    // Configuration
    const SUPABASE_URL = 'https://mwqbnufrszmioqbfmdxe.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im13cWJudWZyc3ptaW9xYmZtZHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyNDI3MDcsImV4cCI6MjA5MDgxODcwN30.jkvcGWlV499Bmxo7TgGqtRoiLcmNsIkYTWP3kR4vPNc';
    
    // Initialize Supabase client
    const supabase = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;
    
    if (!supabase) {
        console.warn('Supabase not loaded. Tracking offline.');
    }

    const CONFIG = {
        trackVisits: true,
        trackClicks: true,
        gdprEnabled: true,
        sessionTimeout: 30 * 60 * 1000,
        batchSize: 10,
        batchTimeout: 5000,
    };

    // State
    let sessionId = null;
    let consentGiven = false;
    let eventQueue = [];
    let batchTimer = null;
    let pageLoadTime = null;
    let heatmapQueue = [];
    let conversionStep = 0;
    
    // ===================================
    // UTILITY FUNCTIONS
    // ===================================
    
    /**
     * Generate UUID v4
     */
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Get or create session ID
     */
    function getSessionId() {
        if (sessionId) return sessionId;
        
        // Try to get from localStorage
        const stored = localStorage.getItem('fintrack_session_id');
        const timestamp = localStorage.getItem('fintrack_session_timestamp');
        
        // Check if session is still valid
        if (stored && timestamp) {
            const age = Date.now() - parseInt(timestamp, 10);
            if (age < CONFIG.sessionTimeout) {
                sessionId = stored;
                updateSessionTimestamp();
                return sessionId;
            }
        }
        
        // Create new session
        sessionId = generateUUID();
        localStorage.setItem('fintrack_session_id', sessionId);
        updateSessionTimestamp();
        
        return sessionId;
    }
    
    /**
     * Update session timestamp
     */
    function updateSessionTimestamp() {
        localStorage.setItem('fintrack_session_timestamp', Date.now().toString());
    }
    
    /**
     * Check GDPR consent
     */
    function checkConsent() {
        if (!CONFIG.gdprEnabled) {
            consentGiven = true;
            return true;
        }
        
        // Check localStorage for consent
        const consent = localStorage.getItem('fintrack_cookie_consent');
        consentGiven = consent === 'true';
        return consentGiven;
    }
    
    /**
     * Set GDPR consent
     */
    function setConsent(given) {
        consentGiven = given;
        localStorage.setItem('fintrack_cookie_consent', given.toString());
        
        // Send consent to backend
        sendRequest('/track/consent', {
            session_id: getSessionId(),
            consent_given: given
        });
        
        // If consent given, flush queued events
        if (given && eventQueue.length > 0) {
            flushEventQueue();
        }
    }
    
    /**
     * Send request directly to Supabase PostgREST
     */
    async function sendRequest(endpoint, data) {
    if (!supabase) return false;
    
    try {
        const pseudoIpHash = data.session_id ? 'client-anon-' + data.session_id.substring(0, 16) : 'anonymous';
        
        if (endpoint === '/track/visit' || endpoint === '/track/page-visit') {
            const { error } = await supabase.from('page_visits').insert([{
                session_id: data.session_id,
                ip_address_hash: pseudoIpHash,
                user_agent: navigator.userAgent,
                page_url: data.page_url,
                referrer: data.referrer || '',
                device_type: /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent) ? 'mobile' : /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent) ? 'tablet' : 'desktop',
                os_name: navigator.userAgent.includes("Win") ? "Windows" : navigator.userAgent.includes("Mac") ? "Mac" : navigator.userAgent.includes("Linux") ? "Linux" : "Unknown",
                browser_name: navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : navigator.userAgent.includes("Safari") ? "Safari" : "Unknown",
                screen_width: window.screen.width,
                screen_height: window.screen.height,
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                time_on_page: data.time_on_page || 0,
                exit_page: data.exit_page || false
            }]);
            if (error) console.error(error);
            
        } else if (endpoint === '/track/click') {
            const { error } = await supabase.from('click_events').insert([{
                session_id: data.session_id,
                button_id: data.button_id,
                button_text: data.button_text,
                page_url: data.page_url,
                ip_address_hash: pseudoIpHash
            }]);
            if (error) console.error(error);
            
        } else if (endpoint === '/track/heartbeat') {
            const { error } = await supabase.from('active_sessions').upsert([{
                session_id: data.session_id,
                page_url: data.page_url,
                last_seen: new Date().toISOString()
            }], { onConflict: 'session_id' });
            if (error) console.error(error);
            
        } else if (endpoint === '/track/consent') {
            const { error } = await supabase.from('cookie_consents').insert([{
                session_id: data.session_id,
                consent_given: data.consent_given,
                ip_address_hash: pseudoIpHash
            }]);
            if (error) console.error(error);
            
        } else if (endpoint === '/track/conversion') {
            const { error } = await supabase.from('conversion_events').insert([{
                session_id: data.session_id,
                event_name: data.event_name,
                event_order: data.event_order,
                page_url: data.page_url,
                event_data: typeof data.event_data === 'object' ? JSON.stringify(data.event_data) : data.event_data
            }]);
            if (error) console.error(error);
            
        } else if (endpoint === '/track/heatmap') {
            if (data.clicks && data.clicks.length > 0) {
                const heatmapRecords = data.clicks.map(click => ({
                    session_id: data.session_id,
                    page_url: click.page_url,
                    x_position: click.x_position,
                    y_position: click.y_position,
                    viewport_width: click.viewport_width,
                    viewport_height: click.viewport_height,
                    element_selector: click.element_selector || '',
                    element_text: click.element_text || ''
                }));
                const { error } = await supabase.from('click_heatmap').insert(heatmapRecords);
                if (error) console.error(error);
            }
        }
        return true;
    } catch (error) {
        console.error('Tracking request error:', error);
        return false;
    }
}
    
    /**
     * Queue event for batch sending
     */
    function queueEvent(endpoint, data) {
        eventQueue.push({ endpoint, data });
        
        // Send immediately if queue is full
        if (eventQueue.length >= CONFIG.batchSize) {
            flushEventQueue();
        } else {
            // Schedule batch send
            if (batchTimer) clearTimeout(batchTimer);
            batchTimer = setTimeout(flushEventQueue, CONFIG.batchTimeout);
        }
    }
    
    /**
     * Flush event queue
     */
    function flushEventQueue() {
        if (eventQueue.length === 0) return;
        
        // Clear timer
        if (batchTimer) {
            clearTimeout(batchTimer);
            batchTimer = null;
        }
        
        // Send all queued events
        const events = [...eventQueue];
        eventQueue = [];
        
        events.forEach(({ endpoint, data }) => {
            sendRequest(endpoint, data);
        });
    }
    
    // ===================================
    // TRACKING FUNCTIONS
    // ===================================
    
    /**
     * Get screen and viewport information
     */
    function getScreenInfo() {
        return {
            screen_width: window.screen.width,
            screen_height: window.screen.height,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight
        };
    }
    
    /**
     * Track page visit
     */
    function trackPageVisit() {
        if (!CONFIG.trackVisits) return;
        
        updateSessionTimestamp();
        
        // Record page load time
        pageLoadTime = Date.now();
        
        const data = {
            session_id: getSessionId(),
            page_url: window.location.href,
            referrer: document.referrer || '',
            timestamp: new Date().toISOString(),
            ...getScreenInfo()
        };
        
        if (checkConsent()) {
            sendRequest('/track/visit', data);
        } else {
            // Queue for later if consent not given
            queueEvent('/track/visit', data);
        }
    }
    
    /**
     * Track page exit and time on page
     */
    function trackPageExit() {
        if (!pageLoadTime) return;
        
        const timeOnPage = Math.floor((Date.now() - pageLoadTime) / 1000); // seconds
        
        const data = {
            session_id: getSessionId(),
            page_url: window.location.href,
            time_on_page: timeOnPage,
            exit_page: true
        };
        
        // We will just queue a visit update for time_on_page
        sendRequest('/track/visit', data);
    }
    
    /**
     * Track click event(element) {
        if (!CONFIG.trackClicks) return;
        
        updateSessionTimestamp();
        
        const buttonId = element.getAttribute('data-track-id');
        const buttonText = element.getAttribute('data-track-label') || 
                          element.textContent.trim() || 
                          element.getAttribute('aria-label') || 
                          'Unknown';
        
        if (!buttonId) {
            console.warn('Element missing data-track-id:', element);
            return;
        }
        
        const data = {
            session_id: getSessionId(),
            button_id: buttonId,
            button_text: buttonText,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        if (checkConsent()) {
            sendRequest('/track/click', data);
        } else {
            // Queue for later if consent not given
            queueEvent('/track/click', data);
        }
    }
    
    /**
     * Track custom event
     */
    function trackEvent(eventName, eventData = {}) {
        if (!checkConsent()) return;
        
        updateSessionTimestamp();
        
        const data = {
            session_id: getSessionId(),
            event_name: eventName,
            event_data: eventData,
            page_url: window.location.href,
            timestamp: new Date().toISOString()
        };
        
        // Use click tracking endpoint for custom events
        sendRequest('/track/click', {
            session_id: data.session_id,
            button_id: `custom_${eventName}`,
            button_text: JSON.stringify(eventData),
            page_url: data.page_url
        });
    }
    
    /**
     * Track heatmap click
     */
    function trackHeatmapClick(event) {
        if (!checkConsent()) return;
        
        const rect = event.target.getBoundingClientRect();
        const clickData = {
            page_url: window.location.href,
            x: event.clientX,
            y: event.clientY + window.scrollY,
            viewport_width: window.innerWidth,
            viewport_height: window.innerHeight,
            element_selector: getElementSelector(event.target),
            element_text: event.target.textContent ? event.target.textContent.substring(0, 100) : ''
        };
        
        heatmapQueue.push(clickData);
        
        // Send in batches
        if (heatmapQueue.length >= 5) {
            flushHeatmapQueue();
        }
    }
    
    /**
     * Get CSS selector for element
     */
    function getElementSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.className) {
            const classes = element.className.split(' ').filter(c => c).join('.');
            return `${element.tagName.toLowerCase()}.${classes}`;
        }
        return element.tagName.toLowerCase();
    }
    
    /**
     * Flush heatmap queue
     */
    function flushHeatmapQueue() {
        if (heatmapQueue.length === 0) return;
        
        const data = {
            session_id: getSessionId(),
            clicks: [...heatmapQueue],
            consent_given: consentGiven
        };
        
        sendRequest('/track/heatmap', data);
        heatmapQueue = [];
    }
    
    /**
     * Track conversion event
     */
    function trackConversion(eventName, eventData = {}) {
        if (!checkConsent()) return;
        
        conversionStep++;
        
        const data = {
            session_id: getSessionId(),
            event_name: eventName,
            page_url: window.location.href,
            event_data: eventData,
            consent_given: consentGiven
        };
        
        sendRequest('/track/conversion', data);
    }
    
    /**
     * Auto-detect conversion events
     */
    function setupConversionTracking() {
        // Track page landing
        trackConversion('page_land');
        
        // Track scroll depth
        let scrollTracked = false;
        window.addEventListener('scroll', function() {
            if (scrollTracked) return;
            
            const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            if (scrollPercent > 50) {
                trackConversion('scroll_50');
                scrollTracked = true;
            }
        });
        
        // Track CTA clicks (buttons with data-track-id)
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-track-id]');
            if (target) {
                const buttonId = target.getAttribute('data-track-id');
                if (buttonId.includes('cta') || buttonId.includes('download') || buttonId.includes('signup')) {
                    trackConversion('cta_click', { button_id: buttonId });
                }
            }
        });
    }
    
    // ===================================
    // INITIALIZATION
    // ===================================
    
    /**
     * Initialize tracking
     */
    function init() {
        // Get or create session
        getSessionId();
        
        // Check consent
        checkConsent();
        
        // Track initial page visit
        trackPageVisit();
        
        // Set up click tracking for elements with data-track-id
        document.addEventListener('click', function(e) {
            const target = e.target.closest('[data-track-id]');
            if (target) {
                trackClick(target);
            }
            
            // Track heatmap clicks
            trackHeatmapClick(e);
        }, true);
        
        // Track page visibility changes (for active session tracking)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                trackPageVisit();
            } else {
                // Flush heatmap when page hidden
                flushHeatmapQueue();
            }
        });
        
        // Flush queue and track page exit before page unload
        window.addEventListener('beforeunload', function() {
            trackPageExit();
            flushEventQueue();
            flushHeatmapQueue();
        });
        
        // Periodic flush of heatmap data
        setInterval(flushHeatmapQueue, 10000); // Every 10 seconds
        
        // Track SPA navigation (for single-page apps)
        if (window.history && window.history.pushState) {
            const originalPushState = window.history.pushState;
            window.history.pushState = function(...args) {
                trackPageExit(); // Track exit from previous page
                originalPushState.apply(this, args);
                setTimeout(trackPageVisit, 100);
            };
        }
        
        // Setup conversion tracking
        setupConversionTracking();
        
        console.log('✅ FinTrack Analytics initialized', {
            sessionId: sessionId,
            consentGiven: consentGiven
        });
    }
    
    // ===================================
    // PUBLIC API
    // ===================================
    
    window.FinTrackAnalytics = {
        // Core functions
        trackPageVisit: trackPageVisit,
        trackClick: trackClick,
        trackEvent: trackEvent,
        trackConversion: trackConversion,
        
        // Consent management
        setConsent: setConsent,
        getConsent: () => consentGiven,
        
        // Session management
        getSessionId: getSessionId,
        
        // Configuration
        configure: function(options) {
            Object.assign(CONFIG, options);
        },
        
        // Manual initialization (if auto-init disabled)
        init: init,
        
        // Utility
        flushHeatmap: flushHeatmapQueue
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

