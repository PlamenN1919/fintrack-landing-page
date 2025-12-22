// ===================================
// LOCOMOTIVE SCROLL INITIALIZATION
// ===================================

// Locomotive Scroll instance
let locomotiveScroll = null;

// Function to forcefully remove section borders
function removeSectionBorders() {
    // Remove borders from all scroll sections
    const sections = document.querySelectorAll('[data-scroll-section], .section, section');
    sections.forEach(section => {
        section.style.setProperty('border', 'none', 'important');
        section.style.setProperty('outline', 'none', 'important');
        section.style.setProperty('box-shadow', 'none', 'important');
        section.style.setProperty('border-top', '0', 'important');
        section.style.setProperty('border-bottom', '0', 'important');
        section.style.setProperty('border-left', '0', 'important');
        section.style.setProperty('border-right', '0', 'important');
        section.style.setProperty('border-width', '0', 'important');
        section.style.setProperty('border-style', 'none', 'important');
    });
    
    // Remove borders from container
    const container = document.querySelector('[data-scroll-container]');
    if (container) {
        container.style.setProperty('border', 'none', 'important');
        container.style.setProperty('outline', 'none', 'important');
        container.style.setProperty('box-shadow', 'none', 'important');
    }
}

// Continuously check and remove borders during scroll
function keepBordersRemoved() {
    removeSectionBorders();
    requestAnimationFrame(keepBordersRemoved);
}

// Initialize Locomotive Scroll
function initLocomotiveScroll() {
    const isMobile = window.innerWidth <= 768;
    
    locomotiveScroll = new LocomotiveScroll({
        el: document.querySelector('[data-scroll-container]'),
        smooth: !isMobile, // Smooth scroll only on desktop
        lerp: 0.08, // Balanced speed (0.8-1s ease)
        multiplier: 1.0, // Scroll speed multiplier
        smartphone: {
            smooth: false // Native scroll on mobile
        },
        tablet: {
            smooth: false // Native scroll on tablet
        },
        reloadOnContextChange: true,
        touchMultiplier: 2.5,
        smoothMobile: false
    });
    
    // FORCE remove any borders from sections after Locomotive initializes
    setTimeout(() => {
        removeSectionBorders();
        // Start continuous border removal with RAF
        keepBordersRemoved();
    }, 100);
    
    // Also remove on Locomotive scroll events
    if (locomotiveScroll) {
        locomotiveScroll.on('scroll', removeSectionBorders);
        locomotiveScroll.on('call', removeSectionBorders);
    }
    
    // Update on window resize with debounce
    let resizeTimeout;
    let wasMobile = isMobile;
    
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const nowMobile = window.innerWidth <= 768;
            
            // If switched between mobile/desktop, reload Locomotive
            if (wasMobile !== nowMobile && locomotiveScroll) {
                locomotiveScroll.destroy();
                locomotiveScroll = initLocomotiveScroll();
                console.log('🔄 Locomotive reloaded for device change');
            } else if (locomotiveScroll) {
                locomotiveScroll.update();
            }
            
            wasMobile = nowMobile;
        }, 250);
    });
    
    // Update after images load
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (img.complete) {
            if (locomotiveScroll) locomotiveScroll.update();
        } else {
            img.addEventListener('load', () => {
                if (locomotiveScroll) locomotiveScroll.update();
            });
        }
    });
    
    return locomotiveScroll;
}

// DOM Elements
const nav = document.querySelector('.main-nav');
const heroTitle = document.querySelector('.brand-title');
const sections = document.querySelectorAll('.section');
const featureCards = document.querySelectorAll('.feature-card');
const scrollIndicator = document.querySelector('.scroll-indicator');
const splineContainer = document.querySelector('.spline-container');
const splineViewer = document.querySelector('spline-viewer');

// Pain Point Calculator Variables
let lossCounter = 0;
let counterInterval;

// ===================================
// SEAMLESS ENTRANCE ANIMATIONS SYSTEM
// ===================================

// Initialize Seamless Scroll Reveal System - Integrated with Locomotive
function initSeamlessReveal() {
    // Check if we're using Locomotive Scroll or native
    const useLocomotiveCallbacks = locomotiveScroll && window.innerWidth > 768;
    
    if (useLocomotiveCallbacks) {
        // Use Locomotive Scroll's native event system for better performance
        locomotiveScroll.on('call', (func, way, obj) => {
            // Locomotive scroll triggered events
            if (func === 'revealSection') {
                obj.el.classList.add('section-visible');
            }
        });
        
        // Update Locomotive to recognize elements
        setTimeout(() => {
            if (locomotiveScroll) locomotiveScroll.update();
        }, 500);
    }
    
    // Keep Intersection Observers as fallback for mobile and compatibility
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
                // Update Locomotive if active
                if (locomotiveScroll && window.innerWidth > 768) {
                    locomotiveScroll.update();
                }
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observer for generic reveal elements
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (locomotiveScroll && window.innerWidth > 768) {
                    locomotiveScroll.update();
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -80px 0px'
    });

    // Observer for stagger children
    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                if (locomotiveScroll && window.innerWidth > 768) {
                    locomotiveScroll.update();
                }
            }
        });
    }, {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
    });

    // Observe all sections
    document.querySelectorAll('.section').forEach(section => {
        sectionObserver.observe(section);
    });

    // Observe footer
    const footer = document.querySelector('.footer');
    if (footer) {
        sectionObserver.observe(footer);
    }

    // Observe all reveal elements
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-rotate, .reveal-fade').forEach(el => {
        revealObserver.observe(el);
    });

    // Observe stagger children containers
    document.querySelectorAll('.stagger-children').forEach(el => {
        staggerObserver.observe(el);
    });
}

// Parallax effect for floating elements - Integrated with Locomotive
function initParallaxEffects() {
    const isMobile = window.innerWidth <= 768;
    
    // On desktop, Locomotive handles main parallax via data attributes
    // Keep native parallax for elements without data attributes
    if (isMobile || !locomotiveScroll) {
        // Mobile/fallback - lightweight native parallax
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    updateParallax(window.pageYOffset);
                    ticking = false;
                });
                ticking = true;
            }
        });
    } else {
        // Desktop with Locomotive - use its scroll event
        locomotiveScroll.on('scroll', (args) => {
            updateParallax(args.scroll.y);
        });
    }
}

function updateParallax(scrolled) {
    const isMobile = window.innerWidth <= 768;
    const speedMultiplier = isMobile ? 0.7 : 1.0; // Lighter on mobile
    
    // Parallax for geometric shapes
    document.querySelectorAll('.fear-geometric-shape').forEach((shape, index) => {
        const speed = (index + 1) * 0.03 * speedMultiplier;
        const yPos = scrolled * speed;
        shape.style.transform = `translateY(${yPos}px)`;
    });
    
    document.querySelectorAll('.stats-shape').forEach((shape, index) => {
        const speed = (index + 1) * 0.02 * speedMultiplier;
        const yPos = scrolled * speed;
        shape.style.transform = `translateY(${yPos}px)`;
    });
    
    document.querySelectorAll('.how-shape').forEach((shape, index) => {
        const speed = (index + 1) * 0.025 * speedMultiplier;
        const yPos = scrolled * speed;
        shape.style.transform = `translateY(${yPos}px)`;
    });
    
    // Custom parallax layers
    document.querySelectorAll('.parallax-slow').forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const distanceFromTop = scrolled - elementTop + window.innerHeight;
        const yPos = distanceFromTop * 0.05 * speedMultiplier;
        el.style.transform = `translateY(${yPos}px)`;
    });
    
    document.querySelectorAll('.parallax-medium').forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const distanceFromTop = scrolled - elementTop + window.innerHeight;
        const yPos = distanceFromTop * 0.1 * speedMultiplier;
        el.style.transform = `translateY(${yPos}px)`;
    });
    
    document.querySelectorAll('.parallax-fast').forEach(el => {
        const rect = el.getBoundingClientRect();
        const elementTop = rect.top + scrolled;
        const distanceFromTop = scrolled - elementTop + window.innerHeight;
        const yPos = distanceFromTop * 0.15 * speedMultiplier;
        el.style.transform = `translateY(${yPos}px)`;
    });
}

// Smooth momentum scrolling enhancement
function initSmoothMomentum() {
    // Add subtle easing to scroll
    let isScrolling = false;
    let scrollTimeout;
    
    const handleScrollState = () => {
        if (!isScrolling) {
            document.body.classList.add('is-scrolling');
            isScrolling = true;
        }
        
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            document.body.classList.remove('is-scrolling');
            isScrolling = false;
        }, 150);
    };
    
    window.addEventListener('scroll', handleScrollState);
    
    // Also listen to Locomotive scroll events
    if (locomotiveScroll) {
        locomotiveScroll.on('scroll', handleScrollState);
    }
}

// Cleanup Locomotive on page unload
window.addEventListener('beforeunload', () => {
    if (locomotiveScroll) {
        locomotiveScroll.destroy();
        console.log('🧹 Locomotive cleaned up');
    }
});

// ===================================
// FEATURES SECTION ANIMATIONS
// ===================================

function initFeaturesAnimations() {
    const featureCards = document.querySelectorAll('.feature-card-animated');
    const isMobile = window.innerWidth <= 768;
    
    // Skip 3D effects on mobile for performance
    if (isMobile) {
        console.log('✨ Features animations initialized (mobile mode)!');
        return;
    }
    
    // Add magnetic effect on mouse move
    featureCards.forEach(card => {
        let isHovering = false;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
            card.style.transition = 'none';
        });
        
        card.addEventListener('mousemove', (e) => {
            if (!isHovering) return;
            
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
            
            // Move glow effect
            const glow = card.querySelector('.card-glow');
            if (glow) {
                const glowX = (x / rect.width) * 100;
                const glowY = (y / rect.height) * 100;
                glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.15), transparent 60%)`;
            }
        });
        
        card.addEventListener('mouseleave', () => {
            isHovering = false;
            card.style.transition = '';
            card.style.transform = '';
            
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.background = '';
            }
        });
        
        // Add click ripple effect
        card.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.className = 'card-ripple';
            
            const rect = card.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            
            card.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
        
        // Sparkle effect on hover
        card.addEventListener('mouseenter', () => {
            createSparkles(card);
        });
    });
    
    // Animate icons subtly on scroll
    if (locomotiveScroll) {
        locomotiveScroll.on('scroll', (args) => {
            featureCards.forEach(card => {
                if (card.classList.contains('card-revealed')) {
                    const icon = card.querySelector('.card-icon i');
                    if (icon) {
                        const rect = card.getBoundingClientRect();
                        const scrollProgress = (window.innerHeight - rect.top) / window.innerHeight;
                        if (scrollProgress > 0 && scrollProgress < 1) {
                            icon.style.transform = `scale(${1 + scrollProgress * 0.1})`;
                        }
                    }
                }
            });
        });
    }
    
    console.log('✨ Features animations initialized!');
}

// Create sparkle particles
function createSparkles(card) {
    const sparkleCount = 3;
    
    for (let i = 0; i < sparkleCount; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.innerHTML = '✨';
            
            const x = Math.random() * 100;
            const y = Math.random() * 100;
            
            sparkle.style.position = 'absolute';
            sparkle.style.left = x + '%';
            sparkle.style.top = y + '%';
            sparkle.style.pointerEvents = 'none';
            sparkle.style.fontSize = '12px';
            sparkle.style.opacity = '0';
            sparkle.style.animation = 'sparkleFloat 1.5s ease-out forwards';
            sparkle.style.zIndex = '20';
            
            card.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 1500);
        }, i * 100);
    }
}

// Animate numbers on reveal
function animateCardNumbers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('numbers-animated')) {
                entry.target.classList.add('numbers-animated');
                
                // Animate any numbers in the card
                const numbers = entry.target.querySelectorAll('[data-number]');
                numbers.forEach(num => {
                    const target = parseInt(num.getAttribute('data-number'));
                    animateNumber(num, 0, target, 1500);
                });
            }
        });
    }, { threshold: 0.3 });
    
    document.querySelectorAll('.feature-card-animated').forEach(card => {
        observer.observe(card);
    });
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (end - start) * easeOutQuart);
        
        element.textContent = current;
        
        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.textContent = end;
        }
    }
    
    requestAnimationFrame(update);
}

// Initialize number animations
setTimeout(() => {
    animateCardNumbers();
}, 500);

// Initialize seamless animations on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Locomotive Scroll first
    locomotiveScroll = initLocomotiveScroll();
    console.log('🚂 Locomotive Scroll initialized!');
    
    // Wait a bit for Locomotive to set up, then initialize other features
    setTimeout(() => {
        initSeamlessReveal();
        initParallaxEffects();
        initSmoothMomentum();
        initFeaturesAnimations();
        console.log('Seamless entrance animations initialized! ✨');
        
        // Force Locomotive to recalculate heights (fixes footer visibility)
        if (locomotiveScroll) {
            locomotiveScroll.update();
            console.log('📏 Locomotive heights updated');
        }
    }, 100);
    
    // Additional update after everything has loaded
    setTimeout(() => {
        if (locomotiveScroll) {
            locomotiveScroll.update();
            console.log('📏 Final Locomotive update');
        }
    }, 500);
    
    // Update on window load (after all images/content)
    window.addEventListener('load', () => {
        if (locomotiveScroll) {
            locomotiveScroll.update();
            console.log('📏 Locomotive updated on window load');
        }
    });
});

// Navigation scroll effect - works with both Locomotive and native scroll
function handleScrollEffects(scrollTop) {
    // Update navigation background opacity
    if (nav && scrollTop > 100) {
        nav.style.background = 'rgba(26, 26, 26, 0.3)';
    } else if (nav) {
        nav.style.background = 'rgba(26, 26, 26, 0.1)';
    }
    
    // Hide scroll indicator when scrolling
    if (scrollIndicator) {
        if (scrollTop > 200) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    }
}

// Listen to both Locomotive scroll and native scroll
if (locomotiveScroll) {
    locomotiveScroll.on('scroll', (args) => {
        handleScrollEffects(args.scroll.y);
    });
}
window.addEventListener('scroll', () => {
    handleScrollEffects(window.pageYOffset);
});

// Smooth scrolling for navigation links - integrated with Locomotive
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            if (locomotiveScroll && window.innerWidth > 768) {
                // Use Locomotive scrollTo on desktop
                locomotiveScroll.scrollTo(target, {
                    offset: 0,
                    duration: 1000,
                    easing: [0.25, 0.0, 0.35, 1.0]
                });
            } else {
                // Fallback to native smooth scroll on mobile
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// Intersection Observer for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe sections for animations
sections.forEach(section => {
    observer.observe(section);
});

// Observe feature cards for staggered animations
featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`;
    observer.observe(card);
});

// Phone mockup animation
const phoneMockup = document.querySelector('.phone-mockup');
if (phoneMockup) {
    const phoneObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                phoneMockup.style.animation = 'slideInRight 1s ease forwards';
            }
        });
    }, { threshold: 0.3 });
    
    phoneObserver.observe(phoneMockup);
}

// Stats counter animation
const stats = document.querySelectorAll('.stat-number');
const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stat = entry.target;
            const finalValue = stat.textContent;
            animateCounter(stat, finalValue);
        }
    });
}, { threshold: 0.5 });

stats.forEach(stat => {
    statsObserver.observe(stat);
});

function animateCounter(element, finalValue) {
    const isNumberOnly = /^\d+/.test(finalValue);
    if (!isNumberOnly) return;
    
    const numericValue = parseInt(finalValue.replace(/\D/g, ''));
    const suffix = finalValue.replace(/[\d,]/g, '');
    const duration = 2000;
    const steps = 60;
    const increment = numericValue / steps;
    
    let current = 0;
    const timer = setInterval(() => {
        current += increment;
        if (current >= numericValue) {
            element.textContent = finalValue;
            clearInterval(timer);
        } else {
            const displayValue = Math.floor(current);
            element.textContent = displayValue.toLocaleString() + suffix;
        }
    }, duration / steps);
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="notification-close">&times;</button>
    `;
    
    // Add notification styles
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '15px 20px',
        borderRadius: '10px',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: '10000',
        transform: 'translateX(100%)',
        transition: 'transform 0.3s ease',
        maxWidth: '400px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
    });
    
    // Set background color based on type
    switch (type) {
        case 'success':
            notification.style.background = '#4CAF50';
            break;
        case 'error':
            notification.style.background = '#f44336';
            break;
        default:
            notification.style.background = '#2196F3';
    }
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.style.cssText = `
        background: none;
        border: none;
        color: #ffffff;
        font-size: 18px;
        margin-left: 10px;
        cursor: pointer;
        opacity: 0.7;
    `;
    
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.opacity = '1';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.opacity = '0.7';
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    if (heroTitle) {
        heroTitle.style.transform = `translateY(${rate}px)`;
    }
});

// Add mouseenter/mouseleave effects to feature cards
featureCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-15px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});

// Download button click tracking
document.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault();
        const platform = this.classList.contains('ios') ? 'iOS' : 'Android';
        showNotification(`Пренасочване към ${platform} магазина...`, 'info');
        
        // Add some visual feedback
        this.style.transform = 'translateY(-8px) scale(0.98)';
        setTimeout(() => {
            this.style.transform = 'translateY(-5px) scale(1)';
        }, 150);
        
        // Simulate redirect after delay
        setTimeout(() => {
            // Replace with actual store URLs
            const storeUrl = platform === 'iOS' ? 
                'https://apps.apple.com' : 
                'https://play.google.com';
            // window.open(storeUrl, '_blank');
        }, 1000);
    });
});

// Add CSS animations dynamically (без opacity hiding за секции)
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(50px);
        }
        to {
            transform: translateX(0);
        }
    }
    
    @keyframes slideInLeft {
        from {
            transform: translateX(-50px);
        }
        to {
            transform: translateX(0);
        }
    }
    
    @keyframes slideInUp {
        from {
            transform: translateY(50px);
        }
        to {
            transform: translateY(0);
        }
    }
    
    .feature-card {
        transform: translateY(30px);
        transition: transform 0.6s ease;
    }
    
    .feature-card.animate-in {
        transform: translateY(0);
    }
`;
document.head.appendChild(style);

// Performance optimization: debounce scroll events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to scroll handlers
const debouncedScrollHandler = debounce(() => {
    const scrollTop = window.pageYOffset;
    
    // Update navigation
    if (nav && scrollTop > 100) {
        nav.style.background = 'rgba(26, 26, 26, 0.95)';
    } else if (nav) {
        nav.style.background = 'rgba(26, 26, 26, 0.9)';
    }
    
    // Update scroll indicator
    if (scrollIndicator) {
        if (scrollTop > 200) {
            scrollIndicator.style.opacity = '0';
        } else {
            scrollIndicator.style.opacity = '1';
        }
    }
    
    // Parallax effect
    const rate = scrollTop * -0.5;
    if (heroTitle) {
        heroTitle.style.transform = `translateY(${rate}px)`;
    }
}, 10);

window.addEventListener('scroll', debouncedScrollHandler);

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add initial animations to elements that should be visible immediately
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.classList.add('animate-in');
    }
    
    // Preload images for better performance
    const imageUrls = [];
    imageUrls.forEach(url => {
        const img = new Image();
        img.src = url;
    });
});

// Add keyboard navigation support
document.addEventListener('keydown', (e) => {
    // ESC key closes notifications
    if (e.key === 'Escape') {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        });
    }
});

// Add focus management for accessibility
document.querySelectorAll('a, button, input, textarea').forEach(element => {
    element.addEventListener('focus', function() {
        this.style.outline = '2px solid #4CAF50';
        this.style.outlineOffset = '2px';
    });
    
    element.addEventListener('blur', function() {
        this.style.outline = 'none';
    });
});

// Spline loading optimization
if (splineViewer && splineContainer) {
    // Preload and show Spline faster
    splineViewer.addEventListener('load', function() {
        setTimeout(() => {
            splineViewer.classList.add('loaded');
            splineContainer.classList.add('loaded');
        }, 100);
    });
    
    // Fallback if load event doesn't fire
    setTimeout(() => {
        if (!splineViewer.classList.contains('loaded')) {
            splineViewer.classList.add('loaded');
            splineContainer.classList.add('loaded');
        }
    }, 2000);
    
    // Immediate visibility for better UX
    setTimeout(() => {
        if (splineViewer) {
            splineViewer.style.opacity = '0.7';
        }
    }, 500);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('FinTrack Landing Page загредена успешно! 🚀');
    initPainPointCalculator();
    initFearOfLossSection();
});

// Pain Point Calculator Functions
function initPainPointCalculator() {
    initLossCounter();
    initCalculatorEvents();
    initPainPointAnimations();
    enhanceFloatingIcons();
}

// Start live loss counter
function initLossCounter() {
    counterInterval = setInterval(() => {
        lossCounter += 0.33;
        const lossElement = document.getElementById('liveLossCounter');
        if (lossElement) {
            lossElement.textContent = lossCounter.toFixed(2) + ' лв';
        }
    }, 1000);
}

// Initialize calculator events
function initCalculatorEvents() {
    // Slider value update
    const savingsSlider = document.getElementById('savingsRate');
    if (savingsSlider) {
        savingsSlider.addEventListener('input', function() {
            const percentElement = document.getElementById('savingsPercent');
            if (percentElement) {
                percentElement.textContent = this.value;
            }
        });
    }
    
    // Calculate button click tracking
    const calculateBtn = document.querySelector('.calculate-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            // Add click analytics tracking
            if (typeof gtag !== 'undefined') {
                gtag('event', 'calculator_started', {
                    'event_category': 'engagement',
                    'event_label': 'pain_point_calculator'
                });
            }
        });
    }
}

// Calculator logic
function calculateLoss() {
    const income = parseFloat(document.getElementById('monthlyIncome').value) || 3000;
    const trackingValue = document.querySelector('input[name="tracking"]:checked')?.value || 'never';
    const savingsRate = parseFloat(document.getElementById('savingsRate').value) || 5;
    
    // Loss calculation logic based on tracking habits
    let lossMultiplier;
    switch(trackingValue) {
        case 'never': lossMultiplier = 0.35; break;
        case 'sometimes': lossMultiplier = 0.20; break;
        case 'always': lossMultiplier = 0.10; break;
        default: lossMultiplier = 0.35;
    }
    
    // Calculate potential savings vs actual savings
    const idealSavingsRate = Math.min(30, savingsRate + 15); // Could save 15% more
    const currentSavings = income * (savingsRate / 100);
    const potentialSavings = income * (idealSavingsRate / 100);
    const monthlyLoss = (potentialSavings - currentSavings) + (income * lossMultiplier * 0.1);
    
    // Display results
    const monthlyLossEl = document.getElementById('monthlyLoss');
    const yearlyLossEl = document.getElementById('yearlyLoss');
    const lifetimeLossEl = document.getElementById('lifetimeLoss');
    
    if (monthlyLossEl) monthlyLossEl.textContent = Math.round(monthlyLoss) + ' лв';
    if (yearlyLossEl) yearlyLossEl.textContent = Math.round(monthlyLoss * 12) + ' лв';
    if (lifetimeLossEl) lifetimeLossEl.textContent = Math.round(monthlyLoss * 120) + ' лв';
    
    // Show results with animation
    const resultsContainer = document.getElementById('calculatorResults');
    if (resultsContainer) {
        resultsContainer.style.display = 'block';
        resultsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Add shock effect for high losses
        if (monthlyLoss > 500) {
            resultsContainer.style.animation = 'shockPulse 0.5s ease-in-out';
        }
    }
    
    // Track conversion event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'calculator_completed', {
            'monthly_loss': Math.round(monthlyLoss),
            'income_range': getIncomeRange(income),
            'tracking_habit': trackingValue
        });
    }
}

function getIncomeRange(income) {
    if (income < 1500) return 'low';
    if (income < 3000) return 'medium';
    if (income < 5000) return 'high';
    return 'very_high';
}

// Initialize pain point section animations
function initPainPointAnimations() {
    const observerOptions = {
        threshold: 0.3,
        rootMargin: '0px'
    };
    
    const painObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate statistics
                const statNumbers = entry.target.querySelectorAll('.stat-number, .stat-num');
                statNumbers.forEach((stat, index) => {
                    setTimeout(() => {
                        animateNumber(stat);
                    }, index * 200);
                });
                
                // Animate warning badge
                const warningBadge = entry.target.querySelector('.warning-badge');
                if (warningBadge) {
                    warningBadge.style.animation = 'urgentPulse 2s infinite';
                }
            }
        });
    }, observerOptions);
    
    const painSection = document.querySelector('.pain-calculator-section');
    if (painSection) {
        painObserver.observe(painSection);
    }
}

function animateNumber(element) {
    const originalText = element.textContent;
    const target = parseInt(originalText.replace(/[^\d]/g, ''));
    const suffix = originalText.replace(/[\d,]/g, '');
    let current = 0;
    const increment = target / 60; // 60 frames animation
    
    function updateNumber() {
        current += increment;
        if (current < target) {
            element.textContent = Math.floor(current).toLocaleString() + suffix;
            requestAnimationFrame(updateNumber);
        } else {
            element.textContent = target.toLocaleString() + suffix;
        }
    }
    
    updateNumber();
}

// Floating icons animation enhancement
function enhanceFloatingIcons() {
    const icons = document.querySelectorAll('.floating-icon');
    icons.forEach((icon, index) => {
        // Add random movement
        setInterval(() => {
            const randomX = (Math.random() - 0.5) * 20;
            const randomY = (Math.random() - 0.5) * 20;
            icon.style.transform = `translate(${randomX}px, ${randomY}px)`;
        }, 3000 + index * 500);
        
        // Add hover effects
        icon.addEventListener('mouseenter', () => {
            icon.style.transform = 'scale(1.2)';
            icon.style.color = '#ffc107';
        });
        
        icon.addEventListener('mouseleave', () => {
            icon.style.transform = 'scale(1)';
            icon.style.color = 'rgba(255, 255, 255, 0.6)';
        });
    });
}

// Add additional CSS animations via JavaScript
const additionalStyles = `
@keyframes urgentPulse {
    0%, 100% { 
        transform: scale(1); 
        box-shadow: 0 0 0 0 rgba(255, 107, 107, 0.4);
    }
    50% { 
        transform: scale(1.05); 
        box-shadow: 0 0 0 10px rgba(255, 107, 107, 0);
    }
}

@keyframes shockPulse {
    0% { transform: scale(1); }
    25% { transform: scale(1.02); }
    50% { transform: scale(1); }
    75% { transform: scale(1.02); }
    100% { transform: scale(1); }
}

.floating-icon {
    transition: all 0.3s ease;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Enhanced Fear of Loss Section Functions
function initFearOfLossSection() {
    // initFearCounters(); // Removed - static numbers only
    initFearAnimations();
    initTimelineAnimations();
    initEnhancedFearFeatures();



}

// Fear counters removed - static numbers only

// Fear animations and interactions
function initFearAnimations() {
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px'
    };
    
    const fearObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Trigger geometric animations
                const geometricShapes = entry.target.querySelectorAll('.fear-geometric-shape');
                geometricShapes.forEach((shape, index) => {
                    setTimeout(() => {
                        shape.style.opacity = '0.15';
                        shape.style.animation = `floatGeometric 20s ease-in-out infinite ${index * -5}s`;
                    }, index * 200);
                });
                
                // Animate glass cards with staggered timing
                const glassCards = entry.target.querySelectorAll('.fear-glass-card');
                glassCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateX(0) scale(1)';
                        
                        // Add subtle continuous animation
                        setTimeout(() => {
                            card.addEventListener('mouseenter', () => {
                                card.style.transform = 'translateY(-8px) scale(1.02)';
                                card.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 40px rgba(255, 107, 107, 0.3)';
                                card.style.background = 'linear-gradient(135deg, rgba(44, 44, 44, 0.95) 0%, rgba(44, 44, 44, 0.85) 50%, rgba(44, 44, 44, 0.95) 100%)';
                            });
                            
                            card.addEventListener('mouseleave', () => {
                                card.style.transform = 'translateY(0) scale(1)';
                                card.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 0, 0, 0.2)';
                                card.style.background = 'linear-gradient(135deg, rgba(44, 44, 44, 0.85) 0%, rgba(44, 44, 44, 0.75) 50%, rgba(44, 44, 44, 0.85) 100%)';
                            });
                        }, 500);
                    }, index * 300 + 500);
                });
                
                // Animate floating warning
                const floatingWarning = entry.target.querySelector('.fear-floating-warning');
                if (floatingWarning) {
                    setTimeout(() => {
                        floatingWarning.style.opacity = '1';
                        floatingWarning.style.transform = 'scale(1) rotate(0deg)';
                    }, 1800);
                }
                


            }
        });
    }, observerOptions);
    
    const fearSection = document.querySelector('.fear-of-loss-section-new');
    if (fearSection) {
        fearObserver.observe(fearSection);
        
        // Initialize glass card interactions
        const glassCards = fearSection.querySelectorAll('.fear-glass-card');
        glassCards.forEach(card => {
            // Add dynamic glowing effect on hover
            card.addEventListener('mouseenter', () => {
                const cardIcon = card.querySelector('.fear-card-icon i');
                if (cardIcon) {
                    cardIcon.style.transform = 'rotate(5deg) scale(1.1)';
                    cardIcon.style.boxShadow = '0 15px 35px rgba(255, 107, 107, 0.6)';
                }
                

            });
            
            card.addEventListener('mouseleave', () => {
                const cardIcon = card.querySelector('.fear-card-icon i');
                if (cardIcon) {
                    cardIcon.style.transform = 'rotate(0deg) scale(1)';
                    cardIcon.style.boxShadow = '0 10px 25px rgba(255, 107, 107, 0.4)';
                }
                

            });
        });
        

    }
}

// Timeline animations
function initTimelineAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        item.addEventListener('mouseenter', () => {
            // Activate timeline item on hover
            item.classList.add('active');
            
            // Show detailed information
            const dot = item.querySelector('.timeline-dot');
            if (dot) {
                dot.style.transform = 'scale(1.5)';
                dot.style.zIndex = '10';
            }
            
            // Add warning effects for critical items
            if (item.classList.contains('critical') || item.classList.contains('devastating')) {
                item.style.animation = item.classList.contains('devastating') ? 
                    'devastatingShake 1s ease-in-out infinite' : 
                    'criticalPulse 1.5s ease-in-out infinite';
            }
        });
        
        item.addEventListener('mouseleave', () => {
            const dot = item.querySelector('.timeline-dot');
            if (dot) {
                dot.style.transform = 'scale(1)';
                dot.style.zIndex = '2';
            }
            
            // Remove temporary animations
            if (!item.classList.contains('active')) {
                item.style.animation = '';
            }
        });
        
        // Progressive revelation of timeline items
        setTimeout(() => {
            item.classList.add('revealed');
            item.style.opacity = '1';
            item.style.transform = 'translateY(0)';
        }, index * 400 + 1000);
    });
    
    // Initially hide timeline items
    timelineItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(20px)';
        item.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
    
    // Animate loss graph bars on scroll
    const observerOptions = {
        threshold: 0.5,
        rootMargin: '0px'
    };
    
    const graphObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.bar');
                bars.forEach((bar, index) => {
                    setTimeout(() => {
                        bar.style.animation = `barGrow 1s ease-out ${index * 0.2}s both, barPulse 2s ease-in-out infinite ${index * 0.2 + 1}s`;
                    }, 500);
                });
            }
        });
    }, observerOptions);
    
    const lossGraph = document.querySelector('.loss-graph');
    if (lossGraph) {
        graphObserver.observe(lossGraph);
    }
}

// Stop losses function (salvation CTA)
function stopLosses() {
    // Track critical conversion attempt
    if (typeof gtag !== 'undefined') {
        gtag('event', 'fear_salvation_attempt', {
            'event_category': 'high_intent_conversion',
            'event_label': 'fear_of_loss_section',
            'emotional_state': 'fear_activated'
        });
    }
    
    // Show dramatic loading state
    const salvationBtn = document.querySelector('.salvation-btn');
    if (salvationBtn) {
        const originalContent = salvationBtn.innerHTML;
        salvationBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fas fa-shield-alt fa-spin"></i>
                <span>АКТИВИРАНЕ НА ЗАЩИТАТА...</span>
            </div>
        `;
        salvationBtn.disabled = true;
        salvationBtn.style.background = 'linear-gradient(45deg, #28a745, #ffc107)';
        
        // Show immediate feedback
        const fearSection = document.querySelector('.fear-of-loss-section');
        if (fearSection) {
            fearSection.style.animation = 'salvationActivated 1s ease-out';
        }
        
        setTimeout(() => {
            salvationBtn.innerHTML = originalContent;
            salvationBtn.disabled = false;
            
            // Show salvation success
            showSalvationSuccess();
        }, 3000);
    }
    
    // Stop all fear counters
    clearInterval(window.fearCounterInterval);
    
    // Transform fear elements to positive
    const fearScenarios = document.querySelectorAll('.fear-scenario');
    fearScenarios.forEach(scenario => {
        scenario.style.borderColor = 'rgba(40, 167, 69, 0.5)';
        scenario.style.background = 'linear-gradient(45deg, rgba(40, 167, 69, 0.1), rgba(255, 193, 7, 0.05))';
    });
}

function showSalvationSuccess() {
    // Create salvation success overlay
    const salvationOverlay = document.createElement('div');
    salvationOverlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(40, 167, 69, 0.95), rgba(0, 0, 0, 0.9));
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: salvationFadeIn 0.5s ease;
        ">
            <div style="
                background: linear-gradient(45deg, rgba(40, 167, 69, 0.9), rgba(255, 193, 7, 0.8));
                padding: 60px;
                border-radius: 25px;
                text-align: center;
                max-width: 600px;
                color: white;
                animation: salvationPop 0.8s ease;
                box-shadow: 0 30px 80px rgba(40, 167, 69, 0.6);
            ">
                <i class="fas fa-shield-alt" style="font-size: 5rem; color: #28a745; margin-bottom: 25px; animation: salvationShield 1s ease-in-out infinite alternate;"></i>
                <h2 style="margin-bottom: 20px; font-size: 2.5rem;">ЗАЩИТАТА АКТИВИРАНА!</h2>
                <p style="margin-bottom: 25px; font-size: 1.2rem;">Загубите са спрени! Вашето финансово бъдеще е в сигурност.</p>
                <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 15px; margin-bottom: 25px;">
                    <h3 style="color: #28a745; margin-bottom: 15px;">ЩЕ ПОЛУЧИТЕ:</h3>
                    <ul style="list-style: none; padding: 0;">
                        <li style="margin-bottom: 10px;">✅ Безплатен достъп за 7 дни</li>
                        <li style="margin-bottom: 10px;">✅ Спиране на загубите веднага</li>
                        <li style="margin-bottom: 10px;">✅ Персонален финансов план</li>
                        <li>✅ 100% гаранция за връщане</li>
                    </ul>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #28a745;
                    border: none;
                    padding: 20px 40px;
                    border-radius: 15px;
                    color: white;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    box-shadow: 0 10px 25px rgba(40, 167, 69, 0.4);
                ">ЗАПОЧНЕТЕ СЕГА</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(salvationOverlay);
}

// Additional CSS animations for fear section
const fearStyles = `
@keyframes fearCounterShock {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); color: #ff0000; }
    100% { transform: scale(1); }
}

@keyframes aggressivePulse {
    0% { transform: scale(1) rotate(0deg); }
    50% { transform: scale(1.2) rotate(-5deg); }
    100% { transform: scale(1) rotate(0deg); }
}

@keyframes salvationActivated {
    0% { filter: brightness(1); }
    50% { filter: brightness(1.3) hue-rotate(120deg); }
    100% { filter: brightness(1); }
}

@keyframes salvationFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes salvationPop {
    from { 
        opacity: 0; 
        transform: scale(0.7) translateY(-50px); 
    }
    to { 
        opacity: 1; 
        transform: scale(1) translateY(0); 
    }
}

@keyframes salvationShield {
    from { 
        transform: scale(1);
        filter: drop-shadow(0 0 20px rgba(40, 167, 69, 0.6));
    }
    to { 
        transform: scale(1.1);
        filter: drop-shadow(0 0 40px rgba(40, 167, 69, 0.9));
    }
}

@keyframes barPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}
`;

// Inject fear styles
const fearStyleSheet = document.createElement('style');
fearStyleSheet.textContent = fearStyles;
document.head.appendChild(fearStyleSheet); 

// Enhanced Fear Section Interactive Features
function initEnhancedFearFeatures() {
    // Initialize enhanced card interactions with urgency effects
    const glassCards = document.querySelectorAll('.fear-glass-card[data-shock="true"]');
    
    glassCards.forEach((card, index) => {
        // Add shock effect on mouse enter
        card.addEventListener('mouseenter', () => {
            card.style.animation = 'cardShock 0.5s ease-in-out';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.animation = '';
        });
    });
}









// Scroll to download function
function scrollToDownload() {
    const downloadSection = document.getElementById('download');
    if (downloadSection) {
        downloadSection.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
}

// Add new keyframe animations via CSS
const enhancedAnimationsCSS = `
@keyframes cardShock {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 25px 50px rgba(255, 71, 87, 0.4); }
    100% { transform: scale(1); }
}



@keyframes lossShock {
    0% { transform: scale(1); }
    50% { transform: scale(1.3); color: #ffd700; }
    100% { transform: scale(1); color: #fff; }
}

@keyframes urgentFlicker {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; color: #ff1a1a; }
}



@keyframes countUp {
    0% { transform: translateY(10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
}
`;

// Inject enhanced animations CSS
const enhancedStyleSheet = document.createElement('style');
enhancedStyleSheet.textContent = enhancedAnimationsCSS;
document.head.appendChild(enhancedStyleSheet);

// Phone Floating Cards - Advanced Interactions
function initPhoneFloatingCards() {
    const floatingCards = document.querySelectorAll('.floating-card');
    
    floatingCards.forEach((card, index) => {
        // Mouse move glow effect
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const glow = card.querySelector('.card-glow');
            if (glow) {
                glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255,255,255,0.4), transparent 70%)`;
            }
        });
        
        // 3D tilt effect on hover
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 15;
            const rotateY = (centerX - x) / 15;
            
            card.style.transform = `translateY(-8px) scale(1.05) perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
    
    // Gentle floating animation
    floatingCards.forEach((card, index) => {
        const randomDelay = Math.random() * 2;
        const randomDuration = 3 + Math.random() * 2;
        
        card.style.animation = `floatIn 0.6s ease-out ${0.1 * (index + 1)}s forwards, 
                                 gentleFloat ${randomDuration}s ease-in-out ${randomDelay}s infinite`;
    });
}

// Add gentle float keyframes via style injection
const floatAnimationCSS = `
@keyframes gentleFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    25% { transform: translateY(-10px) rotate(1deg); }
    75% { transform: translateY(-5px) rotate(-1deg); }
}
`;
const floatStyleSheet = document.createElement('style');
floatStyleSheet.textContent = floatAnimationCSS;
document.head.appendChild(floatStyleSheet);

// Initialize floating cards when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPhoneFloatingCards);
} else {
    initPhoneFloatingCards();
}

// ===================================
// TESTIMONIALS COLUMNS SECTION
// ===================================

function initTestimonialsColumns() {
    // Intersection Observer for performance - pause when not visible
    const testimonialsSection = document.querySelector('.testimonials-columns-section');
    if (testimonialsSection) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const inners = entry.target.querySelectorAll('.testimonials-column-inner');
                inners.forEach(inner => {
                    inner.style.animationPlayState = entry.isIntersecting ? 'running' : 'paused';
                });
            });
        }, { threshold: 0.1 });
        
        visibilityObserver.observe(testimonialsSection);
    }
}

// Initialize testimonials columns
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsColumns);
} else {
    initTestimonialsColumns();
}

// ===================================
// ORBITAL FEAR SECTION
// Like RadialOrbitalTimeline from React
// ===================================

function initOrbitalFearSection() {
    const orbitalItems = document.querySelectorAll('.orbital-item');
    const fearCards = document.querySelectorAll('.fear-detail-card');
    const fearOverlay = document.querySelector('.fear-overlay');
    const closeButtons = document.querySelectorAll('.fear-card-close');
    const fearSection = document.querySelector('.fear-orbital-section');
    
    if (!orbitalItems.length) return;
    
    let rotationAngle = 0;
    let autoRotate = true;
    let animationId = null;
    let isVisible = false;
    
    // Get radius based on screen size
    function getRadius() {
        if (window.innerWidth <= 480) return 140;
        if (window.innerWidth <= 768) return 200;
        return 360; // Larger radius for desktop
    }
    
    // Calculate position for each item (like React version)
    function calculateNodePosition(index, total, angle) {
        const itemAngle = ((index / total) * 360 + angle) % 360;
        const radius = getRadius();
        const radian = (itemAngle * Math.PI) / 180;
        
        const x = radius * Math.cos(radian);
        const y = radius * Math.sin(radian);
        
        // Calculate opacity based on position (front items more visible)
        const opacity = Math.max(0.5, Math.min(1, 0.5 + 0.5 * ((1 + Math.sin(radian)) / 2)));
        
        return { x, y, opacity };
    }
    
    // Update all item positions
    function updatePositions() {
        const total = orbitalItems.length;
        
        orbitalItems.forEach((item, index) => {
            const pos = calculateNodePosition(index, total, rotationAngle);
            const transform = `translate(${pos.x}px, ${pos.y}px)`;
            
            item.style.transform = transform;
            item.style.setProperty('--current-transform', transform);
            item.style.opacity = pos.opacity;
        });
    }
    
    // Animation loop
    function animate() {
        if (autoRotate && isVisible) {
            rotationAngle = (rotationAngle + 0.3) % 360;
            updatePositions();
        }
        animationId = requestAnimationFrame(animate);
    }
    
    // Start animation
    function startAnimation() {
        if (!animationId) {
            animationId = requestAnimationFrame(animate);
        }
    }
    
    // Stop animation
    function stopAnimation() {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
    
    // Click on orbital item to show card
    orbitalItems.forEach((item, index) => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const fearId = item.getAttribute('data-fear');
            openFearCard(fearId, index);
        });
    });
    
    // Close buttons
    closeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeFearCards();
        });
    });
    
    // Click overlay to close
    if (fearOverlay) {
        fearOverlay.addEventListener('click', closeFearCards);
    }
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFearCards();
        }
    });
    
    function openFearCard(fearId, nodeIndex) {
        // Stop auto rotation
        autoRotate = false;
        
        // Center view on clicked node (bring to front)
        const total = orbitalItems.length;
        const targetAngle = 270 - (nodeIndex / total) * 360;
        rotationAngle = targetAngle;
        updatePositions();
        
        // Remove active from all items
        orbitalItems.forEach(item => item.classList.remove('active'));
        
        // Add active to clicked item
        const activeItem = document.querySelector(`.orbital-item[data-fear="${fearId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
        
        // Hide all cards first
        fearCards.forEach(card => card.classList.remove('active'));
        
        // Show the corresponding card
        const targetCard = document.querySelector(`.fear-detail-card[data-card="${fearId}"]`);
        if (targetCard) {
            targetCard.classList.add('active');
        }
        
        // Show overlay
        if (fearOverlay) {
            fearOverlay.classList.add('active');
        }
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
    }
    
    function closeFearCards() {
        // Resume auto rotation
        autoRotate = true;
        
        // Remove active from all items
        orbitalItems.forEach(item => item.classList.remove('active'));
        
        // Hide all cards
        fearCards.forEach(card => card.classList.remove('active'));
        
        // Hide overlay
        if (fearOverlay) {
            fearOverlay.classList.remove('active');
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
    }
    
    // Intersection Observer - pause when not visible for performance & trigger entry animation
    if (fearSection) {
        let hasAnimatedIn = false;
        
        const visibilityObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    startAnimation();
                    
                    // Trigger entry animation only once
                    if (!hasAnimatedIn) {
                        hasAnimatedIn = true;
                        fearSection.classList.add('animate-in');
                    }
                }
            });
        }, { threshold: 0.15 });
        
        visibilityObserver.observe(fearSection);
    }
    
    // Handle resize
    window.addEventListener('resize', () => {
        updatePositions();
    });
    
    // Initial position update
    updatePositions();
    startAnimation();
}

// Initialize orbital fear section
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initOrbitalFearSection);
} else {
    initOrbitalFearSection();
}

// ===================================
// NEW SECTIONS JAVASCRIPT
// ===================================

// Initialize Step Animations for How It Works - Enhanced
function initHowItWorksAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };
    
    const stepsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stepCards = entry.target.querySelectorAll('.step-card');
                stepCards.forEach((card, index) => {
                    setTimeout(() => {
                        card.classList.add('animate-in');
                    }, index * 150);
                });
                
                // Initialize progress tracking
                initProgressTracking();
            }
        });
    }, observerOptions);
    
    const howSection = document.querySelector('.how-it-works-section');
    if (howSection) {
        stepsObserver.observe(howSection);
    }
    
    // 3D Tilt Effect for Cards
    initCardTiltEffect();
    
    // Mouse Glow Effect
    initMouseGlowEffect();
}

// Progress Tracking - динамичен при scroll, но остава в секцията
function initProgressTracking() {
    const progressFill = document.querySelector('.how-progress-fill');
    const progressSteps = document.querySelectorAll('.progress-step');
    const section = document.querySelector('.how-it-works-section');
    
    if (!progressFill || !progressSteps.length || !section) return;
    
    const updateProgress = () => {
        const sectionRect = section.getBoundingClientRect();
        const sectionTop = sectionRect.top;
        const sectionHeight = sectionRect.height;
        const windowHeight = window.innerHeight;
        
        // Изчисляване на прогреса базирано на позицията на секцията
        // 0 = секцията е под viewport, 1 = секцията е над viewport
        const scrollProgress = Math.max(0, Math.min(1, 
            (windowHeight - sectionTop) / (sectionHeight + windowHeight * 0.5)
        ));
        
        progressFill.style.height = `${scrollProgress * 100}%`;
        
        // Update active step
        const activeStep = Math.min(4, Math.floor(scrollProgress * 5));
        progressSteps.forEach((step, index) => {
            if (index <= activeStep) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    };
    
    window.addEventListener('scroll', updateProgress);
    updateProgress();
}

// 3D Tilt Effect
function initCardTiltEffect() {
    const cards = document.querySelectorAll('.step-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// Mouse Glow Effect
function initMouseGlowEffect() {
    const cards = document.querySelectorAll('.step-card');
    
    cards.forEach(card => {
        const glow = card.querySelector('.step-card-glow');
        if (!glow) return;
        
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            glow.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, rgba(102, 126, 234, 0.4) 0%, transparent 70%)`;
        });
    });
}

// Initialize Testimonials Animations
function initTestimonialsAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px'
    };
    
    const testimonialsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const cards = entry.target.querySelectorAll('.testimonial-card');
                cards.forEach((card, index) => {
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, index * 150);
                });
            }
        });
    }, observerOptions);
    
    const testimonialsGrid = document.querySelector('.testimonials-grid');
    if (testimonialsGrid) {
        // Initially hide cards for animation
        const cards = testimonialsGrid.querySelectorAll('.testimonial-card');
        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        });
        
        testimonialsObserver.observe(testimonialsGrid);
    }
}

// Initialize all new sections
document.addEventListener('DOMContentLoaded', function() {
    initHowItWorksAnimations();
    initTestimonialsAnimations();
    initFooterAnimations();
    
    console.log('Нови секции заредени успешно! ✅');
});

// ============================================
// STATS/ACHIEVEMENTS COUNTER ANIMATION
// ============================================

function animateStatsCounter(element, target, suffix = '', duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target + suffix;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current) + suffix;
        }
    }, 16);
}

// Observe stats section for counter animation
const statsSection = document.querySelector('.stats-achievements-section');
if (statsSection) {
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add animate-in class to trigger all animations
                entry.target.classList.add('animate-in');
                
                // Trigger counter animations
                const statItems = entry.target.querySelectorAll('.stat-item');
                
                statItems.forEach((item, index) => {
                    const statNumber = item.querySelector('.stat-number-large');
                    const target = parseInt(statNumber.getAttribute('data-target'));
                    
                    // Determine suffix based on stat position
                    let suffix = '';
                    if (index === 0) suffix = '+'; // 200+
                    if (index === 1) suffix = '%'; // 40%
                    if (index === 2) suffix = '%'; // 100%
                    
                    // Delay counter animation to match the fade-in
                    setTimeout(() => {
                        animateStatsCounter(statNumber, target, suffix);
                    }, 200 + (index * 200));
                });
                
                // Unobserve after animation
                statsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });
    
    statsObserver.observe(statsSection);
}

// Initialize Footer Animations
function initFooterAnimations() {
    const footer = document.querySelector('.footer');
    if (!footer) return;
    
    const footerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Animate footer columns with staggered delay
                const columns = entry.target.querySelectorAll('.footer-column');
                columns.forEach((column, index) => {
                    setTimeout(() => {
                        column.style.opacity = '1';
                        column.style.transform = 'translateY(0)';
                    }, index * 150);
                });
                
                // Animate footer bottom
                const footerBottom = entry.target.querySelector('.footer-bottom');
                if (footerBottom) {
                    setTimeout(() => {
                        footerBottom.style.opacity = '1';
                        footerBottom.style.transform = 'translateY(0)';
                    }, columns.length * 150 + 200);
                }
                
                // Unobserve after animation
                footerObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });
    
    // Initially hide elements for animation
    const columns = footer.querySelectorAll('.footer-column');
    columns.forEach(column => {
        column.style.opacity = '0';
        column.style.transform = 'translateY(30px)';
        column.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });
    
    const footerBottom = footer.querySelector('.footer-bottom');
    if (footerBottom) {
        footerBottom.style.opacity = '0';
        footerBottom.style.transform = 'translateY(20px)';
        footerBottom.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    }
    
    footerObserver.observe(footer);
}

// ===================================
// HELP CENTER MODAL FUNCTIONS
// ===================================

function openHelpCenter() {
    const modal = document.getElementById('helpCenterModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus on search input
        setTimeout(() => {
            const searchInput = document.getElementById('helpSearch');
            if (searchInput) {
                searchInput.focus();
            }
        }, 300);
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'help_center_opened', {
                'event_category': 'engagement',
                'event_label': 'footer_link'
            });
        }
    }
}

function closeHelpCenter() {
    const modal = document.getElementById('helpCenterModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset search
        const searchInput = document.getElementById('helpSearch');
        if (searchInput) {
            searchInput.value = '';
            filterHelpContent('');
        }
        
        // Close all categories
        const categories = modal.querySelectorAll('.help-category');
        categories.forEach(category => {
            category.classList.remove('active');
        });
    }
}

function toggleHelpCategory(categoryElement) {
    categoryElement.classList.toggle('active');
    
    // Close other categories (optional - remove if you want multiple open)
    const allCategories = document.querySelectorAll('.help-category');
    allCategories.forEach(cat => {
        if (cat !== categoryElement && cat.classList.contains('active')) {
            cat.classList.remove('active');
        }
    });
}

// Help Center Search Functionality
function initHelpCenterSearch() {
    const searchInput = document.getElementById('helpSearch');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            filterHelpContent(e.target.value);
        });
        
        // Close on Escape key
        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeHelpCenter();
            }
        });
    }
}

function filterHelpContent(searchTerm) {
    const searchLower = searchTerm.toLowerCase().trim();
    const categories = document.querySelectorAll('.help-category');
    const helpItems = document.querySelectorAll('.help-item');
    
    if (!searchTerm) {
        // Show all if search is empty
        categories.forEach(cat => {
            cat.style.display = '';
        });
        helpItems.forEach(item => {
            item.style.display = '';
        });
        return;
    }
    
    let hasResults = false;
    
    categories.forEach(category => {
        const categoryTitle = category.querySelector('h3').textContent.toLowerCase();
        const items = category.querySelectorAll('.help-item');
        let categoryHasMatch = false;
        
        items.forEach(item => {
            const itemTitle = item.querySelector('h4').textContent.toLowerCase();
            const itemContent = item.querySelector('p').textContent.toLowerCase();
            
            if (itemTitle.includes(searchLower) || itemContent.includes(searchLower)) {
                item.style.display = '';
                categoryHasMatch = true;
                hasResults = true;
            } else {
                item.style.display = 'none';
            }
        });
        
        // Show/hide category based on matches
        if (categoryTitle.includes(searchLower) || categoryHasMatch) {
            category.style.display = '';
            if (categoryHasMatch) {
                category.classList.add('active');
            }
        } else {
            category.style.display = 'none';
        }
    });
    
    // Show "no results" message if needed
    let noResultsMsg = document.querySelector('.help-no-results');
    if (!hasResults && searchTerm) {
        if (!noResultsMsg) {
            noResultsMsg = document.createElement('div');
            noResultsMsg.className = 'help-no-results';
            noResultsMsg.innerHTML = `
                <div style="text-align: center; padding: 40px 20px;">
                    <i class="fas fa-search" style="font-size: 48px; color: rgba(44, 44, 44, 0.3); margin-bottom: 16px;"></i>
                    <h3 style="color: rgba(44, 44, 44, 0.7); margin: 0 0 8px 0;">Няма намерени резултати</h3>
                    <p style="color: rgba(44, 44, 44, 0.5); margin: 0;">Опитайте с различни ключови думи или се свържете с нас</p>
                </div>
            `;
            const helpContent = document.querySelector('.help-center-content');
            if (helpContent) {
                helpContent.appendChild(noResultsMsg);
            }
        }
        noResultsMsg.style.display = 'block';
    } else if (noResultsMsg) {
        noResultsMsg.style.display = 'none';
    }
}

// Close modal on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('helpCenterModal');
        if (modal && modal.classList.contains('active')) {
            closeHelpCenter();
        }
    }
});

// ===================================
// CONTACT MODAL FUNCTIONS
// ===================================

function openContactModal(preselectedSubject = null) {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Pre-select subject if provided
        if (preselectedSubject) {
            const subjectSelect = document.getElementById('contactSubject');
            if (subjectSelect) {
                subjectSelect.value = preselectedSubject;
            }
        }
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = document.getElementById('contactName');
            if (firstInput) {
                firstInput.focus();
            }
        }, 300);
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_modal_opened', {
                'event_category': 'engagement',
                'event_label': preselectedSubject || 'contact_form'
            });
        }
    }
}

// Open Feedback Modal - pre-selects "Обратна връзка" option
function openFeedbackModal() {
    openContactModal('feedback');
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset form
        const form = document.getElementById('contactForm');
        if (form) {
            form.reset();
            // Remove any error states
            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(msg => msg.remove());
            const errorInputs = form.querySelectorAll('.error');
            errorInputs.forEach(input => input.classList.remove('error'));
        }
    }
}

function submitContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('.contact-submit-btn');
    const originalText = submitBtn.innerHTML;
    
    // Get form data
    const formData = {
        name: document.getElementById('contactName').value.trim(),
        email: document.getElementById('contactEmail').value.trim(),
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value.trim()
    };
    
    // Validate
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        showFormError('Моля, попълнете всички задължителни полета.');
        return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
        showFormError('Моля, въведете валиден email адрес.');
        return;
    }
    
    // Disable submit button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Изпращане...';
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        // Success
        showFormSuccess('Съобщението ви е изпратено успешно! Ще се свържем с вас скоро.');
        
        // Reset form
        form.reset();
        
        // Close modal after delay
        setTimeout(() => {
            closeContactModal();
        }, 2000);
        
        // Track conversion
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_submitted', {
                'event_category': 'conversion',
                'event_label': formData.subject
            });
        }
    }, 1500);
}

function showFormError(message) {
    // Remove existing error messages
    const existingErrors = document.querySelectorAll('.form-error-message');
    existingErrors.forEach(err => err.remove());
    
    // Create error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'form-error-message';
    errorDiv.style.cssText = `
        background: rgba(255, 107, 107, 0.1);
        border: 2px solid rgba(255, 107, 107, 0.3);
        color: #ff6b6b;
        padding: 12px 16px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    
    const form = document.getElementById('contactForm');
    form.insertBefore(errorDiv, form.firstChild);
    
    // Scroll to error
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showFormSuccess(message) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.form-success-message, .form-error-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create success message
    const successDiv = document.createElement('div');
    successDiv.className = 'form-success-message';
    successDiv.style.cssText = `
        background: rgba(76, 175, 80, 0.1);
        border: 2px solid rgba(76, 175, 80, 0.3);
        color: #4CAF50;
        padding: 12px 16px;
        border-radius: 12px;
        margin-bottom: 20px;
        font-size: 14px;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    
    const form = document.getElementById('contactForm');
    form.insertBefore(successDiv, form.firstChild);
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Close modals on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const contactModal = document.getElementById('contactModal');
        const helpModal = document.getElementById('helpCenterModal');
        const termsModal = document.getElementById('termsModal');
        const privacyModal = document.getElementById('privacyModal');
        
        if (contactModal && contactModal.classList.contains('active')) {
            closeContactModal();
        } else if (helpModal && helpModal.classList.contains('active')) {
            closeHelpCenter();
        } else if (termsModal && termsModal.classList.contains('active')) {
            closeTermsModal();
        } else if (privacyModal && privacyModal.classList.contains('active')) {
            closePrivacyModal();
        }
    }
});

// Initialize help center when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initHelpCenterSearch();
});

// ===================================
// TERMS OF SERVICE MODAL FUNCTIONS
// ===================================

function openTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'terms_modal_opened', {
                'event_category': 'engagement',
                'event_label': 'terms_of_service'
            });
        }
    }
}

function closeTermsModal() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===================================
// PRIVACY POLICY MODAL FUNCTIONS
// ===================================

function openPrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Track event
        if (typeof gtag !== 'undefined') {
            gtag('event', 'privacy_modal_opened', {
                'event_category': 'engagement',
                'event_label': 'privacy_policy'
            });
        }
    }
}

function closePrivacyModal() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ===================================
// FEATURES SWIPE CAROUSEL
// ===================================

function initFeaturesCarousel() {
    const wrapper = document.querySelector('.features-carousel-wrapper');
    const cards = document.querySelectorAll('.features-carousel-wrapper .bento-card');
    const indicators = document.querySelectorAll('.carousel-indicator');
    const swipeHint = document.querySelector('.swipe-hint');
    
    if (!wrapper || !cards.length) return;
    
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    let startTime = 0;
    
    // Calculate card width including gap
    function getCardWidth() {
        const card = cards[0];
        const cardWidth = card.offsetWidth;
        const gap = 20; // gap between cards
        return cardWidth + gap;
    }
    
    // Update carousel position
    function updateCarousel(animate = true) {
        const cardWidth = getCardWidth();
        const offset = -currentIndex * cardWidth;
        
        if (animate) {
            wrapper.style.transition = 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        } else {
            wrapper.style.transition = 'none';
        }
        
        wrapper.style.transform = `translateX(${offset}px)`;
        
        // Update active card
        cards.forEach((card, index) => {
            if (index === currentIndex) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        // Update indicators
        indicators.forEach((indicator, index) => {
            if (index === currentIndex) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
        
        // Hide swipe hint after first interaction
        if (swipeHint && currentIndex > 0) {
            swipeHint.style.opacity = '0';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 300);
        }
    }
    
    // Go to specific slide
    function goToSlide(index) {
        currentIndex = Math.max(0, Math.min(index, cards.length - 1));
        updateCarousel(true);
    }
    
    // Touch/Mouse start
    function handleStart(e) {
        isDragging = true;
        startTime = Date.now();
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentX = startX;
        wrapper.classList.add('dragging');
        wrapper.style.transition = 'none';
    }
    
    // Touch/Mouse move
    function handleMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        const diff = currentX - startX;
        const cardWidth = getCardWidth();
        const offset = -currentIndex * cardWidth + diff;
        
        wrapper.style.transform = `translateX(${offset}px)`;
    }
    
    // Touch/Mouse end
    function handleEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        wrapper.classList.remove('dragging');
        
        const diff = currentX - startX;
        const cardWidth = getCardWidth();
        const threshold = cardWidth * 0.2; // 20% threshold
        const velocity = Math.abs(diff) / (Date.now() - startTime);
        
        // Determine if we should change slide
        if (Math.abs(diff) > threshold || velocity > 0.5) {
            if (diff > 0 && currentIndex > 0) {
                // Swipe right - go to previous
                currentIndex--;
            } else if (diff < 0 && currentIndex < cards.length - 1) {
                // Swipe left - go to next
                currentIndex++;
            }
        }
        
        updateCarousel(true);
    }
    
    // Mouse events
    wrapper.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    
    // Touch events
    wrapper.addEventListener('touchstart', handleStart, { passive: true });
    wrapper.addEventListener('touchmove', handleMove, { passive: false });
    wrapper.addEventListener('touchend', handleEnd);
    
    // Indicator clicks
    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!wrapper.closest('.phone-section')) return;
        
        const section = wrapper.closest('.phone-section');
        const rect = section.getBoundingClientRect();
        
        // Only handle keyboard if section is visible
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (e.key === 'ArrowLeft') {
                goToSlide(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                goToSlide(currentIndex + 1);
            }
        }
    });
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            updateCarousel(false);
        }, 100);
    });
    
    // Initialize
    updateCarousel(false);
    
    // Auto-hide swipe hint after 5 seconds
    if (swipeHint) {
        setTimeout(() => {
            swipeHint.style.opacity = '0';
            setTimeout(() => {
                swipeHint.style.display = 'none';
            }, 300);
        }, 5000);
    }
}

// Initialize carousel when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFeaturesCarousel);
} else {
    initFeaturesCarousel();
}
 
// ===================================
// TUBELIGHT NAVIGATION
// ===================================

/**
 * Tubelight Navigation System
 * - Active tab tracking based on scroll position
 * - Smooth scroll to sections
 * - Animated lamp effect
 * - Keyboard navigation support
 */

let tubelightNav = {
    navItems: null,
    sections: null,
    currentActiveIndex: 0,
    isScrolling: false,
    scrollTimeout: null,
    
    // Initialize the navigation
    init: function() {
        this.navItems = document.querySelectorAll('.tubelight-item');
        this.sections = document.querySelectorAll('[data-scroll-section]');
        
        if (!this.navItems.length || !this.sections.length) {
            console.warn('Tubelight nav: Missing navigation items or sections');
            return;
        }
        
        // Setup click handlers
        this.setupClickHandlers();
        
        // Setup scroll spy
        this.setupScrollSpy();
        
        // Setup keyboard navigation
        this.setupKeyboardNav();
        
        console.log('✅ Tubelight Navigation initialized');
    },
    
    // Setup click event handlers
    setupClickHandlers: function() {
        this.navItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                const sectionId = item.dataset.section;
                this.scrollToSection(sectionId, index);
            });
        });
    },
    
    // Scroll to a specific section
    scrollToSection: function(sectionId, index) {
        // Find the target section
        let targetSection = null;
        
        // Try to find by ID first
        targetSection = document.getElementById(sectionId);
        
        // If not found, try to find by class or data attribute
        if (!targetSection) {
            targetSection = document.querySelector(`.${sectionId}`);
        }
        
        // Special handling for hero section
        if (sectionId === 'hero') {
            targetSection = document.querySelector('.hero');
        }
        
        if (!targetSection) {
            console.warn(`Section not found: ${sectionId}`);
            return;
        }
        
        // Set active immediately for better UX
        this.setActiveTab(index);
        
        // Use Locomotive Scroll if available
        if (window.locomotiveScroll) {
            this.isScrolling = true;
            window.locomotiveScroll.scrollTo(targetSection, {
                duration: 1200,
                easing: [0.25, 0.0, 0.35, 1.0],
                disableLerp: false,
                callback: () => {
                    this.isScrolling = false;
                }
            });
        } else {
            // Fallback to native smooth scroll
            this.isScrolling = true;
            targetSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            setTimeout(() => {
                this.isScrolling = false;
            }, 1200);
        }
    },
    
    // Set active tab with animation
    setActiveTab: function(index) {
        if (index === this.currentActiveIndex) return;
        
        this.navItems.forEach((item, i) => {
            if (i === index) {
                item.classList.add('active');
                item.setAttribute('aria-current', 'page');
            } else {
                item.classList.remove('active');
                item.removeAttribute('aria-current');
            }
        });
        
        this.currentActiveIndex = index;
    },
    
    // Setup scroll spy with Intersection Observer
    setupScrollSpy: function() {
        // Create a map of section IDs to nav indices
        const sectionMap = new Map();
        
        this.navItems.forEach((item, index) => {
            const sectionId = item.dataset.section;
            sectionMap.set(sectionId, index);
        });
        
        // Intersection Observer options
        const options = {
            root: null,
            rootMargin: '-20% 0px -60% 0px', // Trigger when section is 20% from top
            threshold: [0, 0.1, 0.5, 0.9, 1]
        };
        
        // Track which sections are currently visible
        const visibleSections = new Map();
        
        const observer = new IntersectionObserver((entries) => {
            // Don't update during manual scrolling
            if (this.isScrolling) return;
            
            entries.forEach(entry => {
                const section = entry.target;
                const sectionId = this.getSectionId(section);
                
                if (entry.isIntersecting) {
                    visibleSections.set(sectionId, {
                        ratio: entry.intersectionRatio,
                        top: entry.boundingClientRect.top
                    });
                } else {
                    visibleSections.delete(sectionId);
                }
            });
            
            // Find the most visible section (highest ratio, or topmost if equal)
            let mostVisibleSection = null;
            let highestRatio = 0;
            let topMostPosition = Infinity;
            
            visibleSections.forEach((data, sectionId) => {
                if (data.ratio > highestRatio || 
                    (data.ratio === highestRatio && data.top < topMostPosition)) {
                    highestRatio = data.ratio;
                    topMostPosition = data.top;
                    mostVisibleSection = sectionId;
                }
            });
            
            // Update active tab
            if (mostVisibleSection && sectionMap.has(mostVisibleSection)) {
                const index = sectionMap.get(mostVisibleSection);
                this.setActiveTab(index);
            }
        }, options);
        
        // Observe all sections
        this.sections.forEach(section => {
            observer.observe(section);
        });
    },
    
    // Get section ID from element
    getSectionId: function(section) {
        // Try ID first
        if (section.id) return section.id;
        
        // Try data-section attribute
        if (section.dataset.section) return section.dataset.section;
        
        // Check if it's hero section
        if (section.classList.contains('hero')) return 'hero';
        
        // Try to extract from class names
        const classList = Array.from(section.classList);
        for (let className of classList) {
            if (className.includes('features')) return 'features';
            if (className.includes('pricing')) return 'pricing';
            if (className.includes('download')) return 'download';
        }
        
        return null;
    },
    
    // Setup keyboard navigation
    setupKeyboardNav: function() {
        document.addEventListener('keydown', (e) => {
            // Only handle if nav is visible (desktop)
            const nav = document.querySelector('.tubelight-nav');
            if (!nav || window.getComputedStyle(nav).display === 'none') {
                return;
            }
            
            // Arrow Up/Down navigation
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                e.preventDefault();
                
                let newIndex = this.currentActiveIndex;
                
                if (e.key === 'ArrowUp') {
                    newIndex = Math.max(0, this.currentActiveIndex - 1);
                } else {
                    newIndex = Math.min(this.navItems.length - 1, this.currentActiveIndex + 1);
                }
                
                if (newIndex !== this.currentActiveIndex) {
                    const targetItem = this.navItems[newIndex];
                    const sectionId = targetItem.dataset.section;
                    this.scrollToSection(sectionId, newIndex);
                }
            }
        });
    }
};

// Initialize Tubelight Navigation after DOM is ready
function initTubelightNavigation() {
    // Wait a bit for Locomotive Scroll to initialize
    setTimeout(() => {
        tubelightNav.init();
    }, 500);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTubelightNavigation);
} else {
    initTubelightNavigation();
}

