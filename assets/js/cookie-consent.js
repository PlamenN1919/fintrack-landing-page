/**
 * FinTrack GDPR Cookie Consent Banner
 * Modern, compliant cookie consent implementation
 */

(function() {
    'use strict';
    
    // Check if consent already given
    if (localStorage.getItem('fintrack_cookie_consent') !== null) {
        return; // Already decided, don't show banner
    }
    
    // Create banner HTML
    const bannerHTML = `
        <div id="cookie-consent-banner" class="cookie-consent-banner">
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <div class="cookie-consent-icon">
                        <i class="fas fa-cookie-bite"></i>
                    </div>
                    <div class="cookie-consent-text">
                        <h3 class="cookie-consent-title">Бисквитки и поверителност</h3>
                        <p class="cookie-consent-description">
                            Използваме бисквитки (cookies) за подобряване на потребителското изживяване 
                            и анализиране на трафика на сайта. Вашите данни са анонимизирани и защитени 
                            в съответствие с GDPR.
                        </p>
                    </div>
                </div>
                <div class="cookie-consent-actions">
                    <button id="cookie-accept" class="cookie-btn cookie-btn-accept">
                        <i class="fas fa-check"></i> Приемам
                    </button>
                    <button id="cookie-decline" class="cookie-btn cookie-btn-decline">
                        <i class="fas fa-times"></i> Отказвам
                    </button>
                    <a href="#" onclick="openPrivacyModal(); return false;" class="cookie-learn-more">
                        Научете повече
                    </a>
                </div>
            </div>
        </div>
    `;
    
    // Create banner styles
    const bannerStyles = `
        <style>
            .cookie-consent-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(135deg, rgba(26, 26, 26, 0.98) 0%, rgba(44, 44, 44, 0.98) 100%);
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                padding: 24px;
                box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.5);
                z-index: 999999;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                animation: slideUpFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                transform: translateY(100%);
                opacity: 0;
            }
            
            @keyframes slideUpFadeIn {
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .cookie-consent-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 32px;
                flex-wrap: wrap;
            }
            
            .cookie-consent-content {
                display: flex;
                align-items: center;
                gap: 20px;
                flex: 1;
                min-width: 300px;
            }
            
            .cookie-consent-icon {
                font-size: 48px;
                color: #ffc107;
                animation: gentleBounce 2s ease-in-out infinite;
            }
            
            @keyframes gentleBounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            .cookie-consent-text {
                flex: 1;
            }
            
            .cookie-consent-title {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                letter-spacing: -0.3px;
            }
            
            .cookie-consent-description {
                margin: 0;
                font-size: 14px;
                line-height: 1.6;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .cookie-consent-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .cookie-btn {
                padding: 12px 24px;
                border: none;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                display: inline-flex;
                align-items: center;
                gap: 8px;
                font-family: inherit;
            }
            
            .cookie-btn-accept {
                background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
                color: #ffffff;
                box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
            }
            
            .cookie-btn-accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(76, 175, 80, 0.6);
            }
            
            .cookie-btn-decline {
                background: rgba(255, 255, 255, 0.1);
                color: #ffffff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .cookie-btn-decline:hover {
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
            }
            
            .cookie-learn-more {
                color: rgba(255, 255, 255, 0.7);
                text-decoration: none;
                font-size: 13px;
                transition: color 0.3s ease;
                border-bottom: 1px dashed rgba(255, 255, 255, 0.3);
            }
            
            .cookie-learn-more:hover {
                color: #ffffff;
                border-bottom-color: #ffffff;
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .cookie-consent-banner {
                    padding: 20px 16px;
                }
                
                .cookie-consent-container {
                    flex-direction: column;
                    gap: 20px;
                }
                
                .cookie-consent-content {
                    flex-direction: column;
                    text-align: center;
                    gap: 16px;
                }
                
                .cookie-consent-icon {
                    font-size: 36px;
                }
                
                .cookie-consent-title {
                    font-size: 16px;
                }
                
                .cookie-consent-description {
                    font-size: 13px;
                }
                
                .cookie-consent-actions {
                    width: 100%;
                    justify-content: center;
                }
                
                .cookie-btn {
                    flex: 1;
                    justify-content: center;
                }
            }
        </style>
    `;
    
    // Inject styles and banner into page
    function injectBanner() {
        // Add styles
        document.head.insertAdjacentHTML('beforeend', bannerStyles);
        
        // Add banner
        document.body.insertAdjacentHTML('beforeend', bannerHTML);
        
        // Set up event listeners
        document.getElementById('cookie-accept').addEventListener('click', acceptCookies);
        document.getElementById('cookie-decline').addEventListener('click', declineCookies);
    }
    
    // Accept cookies
    function acceptCookies() {
        localStorage.setItem('fintrack_cookie_consent', 'true');
        
        // Notify analytics
        if (window.FinTrackAnalytics) {
            window.FinTrackAnalytics.setConsent(true);
        }
        
        // Remove banner with animation
        const banner = document.getElementById('cookie-consent-banner');
        banner.style.animation = 'slideDownFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        
        setTimeout(() => {
            banner.remove();
        }, 400);
        
        console.log('✅ Cookie consent given');
    }
    
    // Decline cookies
    function declineCookies() {
        localStorage.setItem('fintrack_cookie_consent', 'false');
        
        // Notify analytics
        if (window.FinTrackAnalytics) {
            window.FinTrackAnalytics.setConsent(false);
        }
        
        // Remove banner with animation
        const banner = document.getElementById('cookie-consent-banner');
        banner.style.animation = 'slideDownFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
        
        setTimeout(() => {
            banner.remove();
        }, 400);
        
        console.log('❌ Cookie consent declined');
    }
    
    // Add slideDown animation
    const additionalStyles = document.createElement('style');
    additionalStyles.textContent = `
        @keyframes slideDownFadeOut {
            to {
                transform: translateY(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(additionalStyles);
    
    // Initialize banner when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectBanner);
    } else {
        injectBanner();
    }
    
})();

