/**
 * FinTrack Analytics Tracking Script
 * Universal event tracking with GDPR compliance
 */

(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        apiUrl: window.ANALYTICS_API_URL || 'http://localhost:5000/api',
        trackVisits: true,
        trackClicks: true,
        gdprEnabled: true,
        sessionTimeout: 30 * 60 * 1000, // 30 minutes
        batchSize: 10,
        batchTimeout: 5000, // 5 seconds
    };
    
    // State
    let sessionId = null;
    let consentGiven = false;
    let eventQueue = [];
    let batchTimer = null;
    
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
     * Send request to API
     */
    async function sendRequest(endpoint, data) {
        try {
            const response = await fetch(`${CONFIG.apiUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    consent_given: consentGiven
                }),
                credentials: 'same-origin'
            });
            
            if (!response.ok) {
                console.warn(`Tracking request failed: ${response.status}`);
            }
            
            return response.ok;
        } catch (error) {
            console.warn('Tracking request error:', error);
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
     * Track page visit
     */
    function trackPageVisit() {
        if (!CONFIG.trackVisits) return;
        
        updateSessionTimestamp();
        
        const data = {
            session_id: getSessionId(),
            page_url: window.location.href,
            referrer: document.referrer || '',
            timestamp: new Date().toISOString()
        };
        
        if (checkConsent()) {
            sendRequest('/track/visit', data);
        } else {
            // Queue for later if consent not given
            queueEvent('/track/visit', data);
        }
    }
    
    /**
     * Track click event
     */
    function trackClick(element) {
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
        }, true);
        
        // Track page visibility changes (for active session tracking)
        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                trackPageVisit();
            }
        });
        
        // Flush queue before page unload
        window.addEventListener('beforeunload', function() {
            flushEventQueue();
        });
        
        // Track SPA navigation (for single-page apps)
        if (window.history && window.history.pushState) {
            const originalPushState = window.history.pushState;
            window.history.pushState = function(...args) {
                originalPushState.apply(this, args);
                setTimeout(trackPageVisit, 100);
            };
        }
        
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
        init: init
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

