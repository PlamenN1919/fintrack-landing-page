// ===================================
// PAGE LOADER
// ===================================

// Track loading progress
let resourcesLoaded = 0;
let totalResources = 0;

// Function to update loader text with progress
function updateLoaderProgress() {
    const loaderText = document.querySelector('.loader-text');
    if (loaderText && totalResources > 0) {
        const percentage = Math.round((resourcesLoaded / totalResources) * 100);
        loaderText.textContent = `Зареждане... ${percentage}%`;
    }
}

// Count total resources to load
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    totalResources = images.length + scripts.length + stylesheets.length;
    
    // Track image loading
    images.forEach(img => {
        if (img.complete) {
            resourcesLoaded++;
            updateLoaderProgress();
        } else {
            img.addEventListener('load', () => {
                resourcesLoaded++;
                updateLoaderProgress();
            });
            img.addEventListener('error', () => {
                resourcesLoaded++;
                updateLoaderProgress();
            });
        }
    });
});

// Page loader functionality
window.addEventListener('load', function() {
    // Ensure minimum loading time for smooth UX (800ms)
    setTimeout(() => {
        const loader = document.getElementById('page-loader');
        const body = document.body;
        const loaderText = document.querySelector('.loader-text');
        
        if (loaderText) {
            loaderText.textContent = 'Зареждане завършено!';
        }
        
        // Small delay to show completion message
        setTimeout(() => {
            if (loader) {
                loader.classList.add('loaded');
                loader.style.pointerEvents = 'none'; // CRITICAL: Stop blocking touches
                body.classList.add('loaded');
                body.style.overflow = ''; // Ensure body can scroll again
                
                // Remove loader from DOM after animation completes
                setTimeout(() => {
                    if (loader.parentNode) {
                        loader.remove();
                    }
                }, 500);
            }
        }, 300);
    }, 800);
});

// Fallback: Remove loader if it takes too long (max 8 seconds)
setTimeout(() => {
    const loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('loaded')) {
        loader.classList.add('loaded');
        loader.style.pointerEvents = 'none'; // CRITICAL: Stop blocking touches
        document.body.classList.add('loaded');
        document.body.style.overflow = ''; // Ensure body can scroll again
        setTimeout(() => {
            if (loader.parentNode) {
                loader.remove();
            }
        }, 500);
    }
}, 8000);

// ===================================
// PERFORMANCE OPTIMIZATIONS
// ===================================

// Lazy load Spline 3D viewer for better LCP
let splineLoaded = false;
function loadSpline3D() {
    if (splineLoaded) return;
    
    const container = document.getElementById('spline-container');
    if (!container) return;
    
    // Load Spline module dynamically
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://unpkg.com/@splinetool/viewer@1.12.6/build/spline-viewer.js';
    script.onload = () => {
        // Create spline viewer after module loads
        setTimeout(() => {
            const viewer = document.createElement('spline-viewer');
            viewer.setAttribute('url', 'https://prod.spline.design/Ro5YtAjgAQsnFD3S/scene.splinecode');
            viewer.setAttribute('loading-anim', 'true');
            container.appendChild(viewer);
            container.classList.add('loaded');
            splineLoaded = true;
            console.log('🎨 Spline 3D loaded');
        }, 100);
    };
    document.head.appendChild(script);
}

// Initialize Spline loading with Intersection Observer
function initSplineLazyLoad() {
    const container = document.getElementById('spline-container');
    if (!container) return;
    
    // Use Intersection Observer for lazy loading
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    loadSpline3D();
                    observer.disconnect();
                }
            });
        }, {
            rootMargin: '100px', // Start loading slightly before visible
            threshold: 0
        });
        observer.observe(container);
    } else {
        // Fallback for older browsers
        loadSpline3D();
    }
}

// Start Spline lazy loading on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initSplineLazyLoad);

// ===================================
// ENHANCED IMAGE LAZY LOADING
// ===================================

// Progressive image loading with blur-up effect
function initEnhancedImageLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    
    if ('loading' in HTMLImageElement.prototype) {
        // Native lazy loading supported
        images.forEach(img => {
            // Add loaded class when image loads for smooth transition
            if (img.complete) {
                img.classList.add('loaded');
            } else {
                img.addEventListener('load', () => {
                    img.classList.add('loaded');
                }, { once: true });
            }
        });
    } else {
        // Fallback for older browsers using Intersection Observer
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                    }
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

// Preload critical images that are about to enter viewport
function preloadUpcomingImages() {
    const images = document.querySelectorAll('img[data-preload]');
    
    const preloadObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                // Create a new image to preload
                const preloadImg = new Image();
                preloadImg.src = img.src || img.dataset.src;
                preloadObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: '200px 0px', // Start preloading 200px before visible
        threshold: 0
    });
    
    images.forEach(img => preloadObserver.observe(img));
}

document.addEventListener('DOMContentLoaded', () => {
    initEnhancedImageLoading();
    preloadUpcomingImages();
});

// ===================================
// EVENT LISTENER OPTIMIZATION
// ===================================

// Cleanup function for removing event listeners
const eventListenerRegistry = new Map();

function addOptimizedEventListener(element, event, handler, options = {}) {
    const key = `${element.tagName || 'window'}-${event}`;
    
    // Merge with passive by default for scroll/touch events
    const passiveEvents = ['scroll', 'touchstart', 'touchmove', 'wheel'];
    if (passiveEvents.includes(event) && options.passive === undefined) {
        options.passive = true;
    }
    
    element.addEventListener(event, handler, options);
    
    // Track for cleanup
    if (!eventListenerRegistry.has(key)) {
        eventListenerRegistry.set(key, []);
    }
    eventListenerRegistry.get(key).push({ element, event, handler, options });
}

// Cleanup all event listeners on page unload
window.addEventListener('beforeunload', () => {
    eventListenerRegistry.forEach((listeners) => {
        listeners.forEach(({ element, event, handler, options }) => {
            try {
                element.removeEventListener(event, handler, options);
            } catch (e) {
                // Ignore errors during cleanup
            }
        });
    });
    eventListenerRegistry.clear();
});

// Passive event listeners for better scroll performance
const passiveSupported = (() => {
    let passive = false;
    try {
        const options = {
            get passive() {
                passive = true;
                return false;
            }
        };
        window.addEventListener('test', null, options);
        window.removeEventListener('test', null, options);
    } catch (err) {
        passive = false;
    }
    return passive;
})();

const passiveEvent = passiveSupported ? { passive: true } : false;

// Optimized debounce function
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

// Optimized throttle function
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ===================================
// ===================================
// LENIS SCROLL INITIALIZATION
// ===================================

let lenis = null;

function initLenisScroll() {
    // Disable Lenis entirely on mobile or touch devices to fix iOS scroll block
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth <= 768;
    if (isTouchDevice) {
        document.documentElement.style.scrollBehavior = 'smooth';
        console.log("📱 Lenis disabled for touch devices (using native scroll)");
        return null;
    }

    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return lenis;
}

// Cleanup Lenis on page unload
window.addEventListener('beforeunload', () => {
    if (lenis) {
        lenis.destroy();
        console.log('🧹 Lenis cleaned up');
    }
});

// DOM Elements
const nav = document.querySelector('.main-nav');
const heroTitle = document.querySelector('.brand-title');
const sections = document.querySelectorAll('.section');
const featureCards = document.querySelectorAll('.feature-card');
const scrollIndicator = document.querySelector('.scroll-indicator');
const splineContainer = document.querySelector('.spline-container');
const splineViewer = document.querySelector('spline-viewer');

// ===================================
// SEAMLESS ENTRANCE ANIMATIONS SYSTEM
// ===================================

function initSeamlessReveal() {
    const isMobile = window.innerWidth <= 768;

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

    const staggerObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.2, rootMargin: '0px 0px -50px 0px' });

    const scrollClassObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const customClass = entry.target.dataset.scrollClass;
                if (customClass) {
                    entry.target.classList.add(customClass);
                    const delay = entry.target.dataset.scrollDelay;
                    if (delay && !isMobile) {
                        entry.target.style.transitionDelay = `${delay}s`;
                    }
                }
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('.section, .footer').forEach(el => sectionObserver.observe(el));
    document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-rotate, .reveal-fade').forEach(el => revealObserver.observe(el));
    document.querySelectorAll('.stagger-children').forEach(el => staggerObserver.observe(el));
    document.querySelectorAll('[data-scroll-class]').forEach(el => scrollClassObserver.observe(el));
}

// ===================================
// CUSTOM NATIVE PARALLAX (Replaces Locomotive data-scroll-speed)
// ===================================

function initParallaxEffects() {
    if (!lenis) return;
    
    // Pre-cache elements
    const parallaxElements = Array.from(document.querySelectorAll('[data-scroll-speed]')).map(el => {
        return {
            el: el,
            speed: parseFloat(el.dataset.scrollSpeed) || 0
        };
    });

    const isMobile = window.innerWidth <= 768;
    const speedMultiplier = isMobile ? 0.3 : 0.6; 

    lenis.on('scroll', (e) => {
        const scrolled = e.scroll;
        const windowHeight = window.innerHeight;

        document.querySelectorAll('.fear-geometric-shape').forEach((shape, index) => {
            const speed = (index + 1) * 0.015 * speedMultiplier;
            const yPos = scrolled * speed;
            shape.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
        
        document.querySelectorAll('.stats-shape').forEach((shape, index) => {
            const speed = (index + 1) * 0.01 * speedMultiplier;
            const yPos = scrolled * speed;
            shape.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });

        parallaxElements.forEach(item => {
            if(item.speed === 0) return;
            const rect = item.el.getBoundingClientRect();
            // Calculate distance from center to perfectly map Locomotive behavior without jumps
            const distFromCenter = (rect.top + rect.height/2) - (windowHeight/2);
            const yPos = distFromCenter * item.speed * speedMultiplier;
            item.el.style.transform = `translate3d(0, ${yPos}px, 0)`;
        });
    });
}

// ===================================
// FEATURES SECTION ANIMATIONS
// ===================================

function initFeaturesAnimations() {
    const featureCards = document.querySelectorAll('.feature-card-animated');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        console.log('✨ Features animations initialized (mobile mode)!');
        return;
    }
    
    featureCards.forEach(card => {
        let isHovering = false;
        
        card.addEventListener('mouseenter', () => {
            isHovering = true;
            card.style.transition = 'none';
            createSparkles(card);
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
            if (glow) glow.style.background = '';
        });
        
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
    });
    
    if (lenis) {
        lenis.on('scroll', () => {
            featureCards.forEach(card => {
                if (card.classList.contains('card-revealed') || card.classList.contains('active')) {
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

function createSparkles(card) {
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.innerHTML = '✨';
            sparkle.style.position = 'absolute';
            sparkle.style.left = (Math.random() * 100) + '%';
            sparkle.style.top = (Math.random() * 100) + '%';
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

function animateCardNumbers() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.classList.contains('numbers-animated')) {
                entry.target.classList.add('numbers-animated');
                entry.target.querySelectorAll('[data-number]').forEach(num => {
                    animateNumber(num, 0, parseInt(num.getAttribute('data-number')), 1500);
                });
            }
        });
    }, { threshold: 0.3 });
    document.querySelectorAll('.feature-card-animated').forEach(card => observer.observe(card));
}

function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        element.textContent = Math.floor(start + (end - start) * easeOutQuart);
        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = end;
    }
    requestAnimationFrame(update);
}

setTimeout(() => { animateCardNumbers(); }, 500);

// ===================================
// BENTO GRID REVEAL ON SCROLL
// ===================================
function initBentoReveal() {
    const bentoCards = document.querySelectorAll('[data-bento-reveal]');
    if (!bentoCards.length) return;

    const bentoObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('bento-visible');
                bentoObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    });

    bentoCards.forEach(card => bentoObserver.observe(card));
}

// ===================================
// COMPARISON SECTION REVEAL + COUNTER
// ===================================
function initComparisonReveal() {
    const compElements = document.querySelectorAll('[data-comp-reveal]');
    if (!compElements.length) return;

    const compObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');

                // Animate counter if present
                const counter = entry.target.querySelector('[data-comp-counter]');
                if (counter && !counter.classList.contains('counted')) {
                    counter.classList.add('counted');
                    const target = parseInt(counter.getAttribute('data-comp-counter'));
                    let current = 0;
                    const duration = 1200;
                    const startTime = performance.now();
                    function updateCounter(now) {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 4);
                        current = Math.floor(target * ease);
                        counter.textContent = current;
                        if (progress < 1) requestAnimationFrame(updateCounter);
                        else counter.textContent = target;
                    }
                    requestAnimationFrame(updateCounter);
                }

                compObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px'
    });

    compElements.forEach(el => compObserver.observe(el));
}

document.addEventListener('DOMContentLoaded', () => {
    initLenisScroll();
    initSeamlessReveal();
    initParallaxEffects();
    initFeaturesAnimations();
    initBentoReveal();
    initComparisonReveal();
    initDreamVisualizer();
});

// ===================================
// DREAM VISUALIZER & ANIMATIONS
// ===================================

function initDreamVisualizer() {
    // 1. Reveal Animations for Dream Section
    const dreamElements = document.querySelectorAll('[data-dream-reveal]');
    if (dreamElements.length) {
        const dreamObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('dream-visible');
                    dreamObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -50px 0px'
        });

        dreamElements.forEach(el => dreamObserver.observe(el));
    }

    // 2. Interactive Calculator Logic
    const slider = document.getElementById('dream-savings-slider');
    const displayValue = document.getElementById('dream-slider-display');
    const goalBtns = document.querySelectorAll('.dream-goal-btn');
    
    const resultMonths = document.getElementById('dream-result-months');
    const resultPhrase = document.getElementById('dream-result-phrase');
    const resultEmoji = document.getElementById('dream-result-emoji');
    const resultGoalName = document.getElementById('dream-result-goal-name');
    
    const statTotal = document.getElementById('dream-stat-total');
    const statMonthly = document.getElementById('dream-stat-monthly');
    const statDaily = document.getElementById('dream-stat-daily');
    const progressBar = document.getElementById('dream-progress');

    if (!slider) return;

    let currentGoalAmount = 2800;
    let currentGoalName = "Ваканция в Гърция";
    let currentEmoji = "🏖️";

    function updateCalculator() {
        const monthlySavings = parseInt(slider.value);
        
        // Update slider visually
        const percent = ((monthlySavings - slider.min) / (slider.max - slider.min)) * 100;
        slider.style.background = `linear-gradient(90deg, #B4F461 ${percent}%, #e0e0e0 ${percent}%)`;
        
        // Update labels
        displayValue.innerHTML = `<span>${monthlySavings}</span> лв/месец`;
        statMonthly.textContent = `${monthlySavings} лв`;
        statTotal.textContent = `${currentGoalAmount.toLocaleString()} лв`;
        statDaily.textContent = `~${Math.round(monthlySavings / 30)} лв`;

        // Calculate months
        const monthsNeeded = Math.ceil(currentGoalAmount / monthlySavings);
        
        // Animate numbers
        animateNumber(resultMonths, parseInt(resultMonths.innerText) || 0, monthsNeeded, 800);
        
        // Update phrase based on goal
        let destinationText = "";
        if (currentGoalName.includes("Ваканция")) destinationText = "ще бъдеш на плажа в Гърция 🇬🇷";
        else if (currentGoalName.includes("Кола")) destinationText = "ще караш новата си кола 🚗";
        else if (currentGoalName.includes("Жилище")) destinationText = "ще вземеш ключовете за новия си дом 🔑";
        else destinationText = "ще имаш сигурен пенсионен фонд 🌅";

        resultPhrase.innerHTML = `След <span class="phrase-highlight">${monthsNeeded} месеца</span> ${destinationText}`;

        // Update progress bar width visually based on perceived effort
        // Just a visual representation, shorter times = fuller bar
        let progressVal = Math.max(10, 100 - (monthsNeeded * 1.5));
        progressVal = Math.min(100, progressVal); // Cap at 100
        progressBar.style.width = `${progressVal}%`;
    }

    // Event Listeners
    slider.addEventListener('input', updateCalculator);

    goalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            goalBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            
            // Get new values
            currentGoalAmount = parseInt(btn.getAttribute('data-amount'));
            currentGoalName = btn.getAttribute('data-name');
            currentEmoji = btn.getAttribute('data-emoji');
            
            // Update UI elements
            resultGoalName.textContent = currentGoalName;
            resultEmoji.textContent = currentEmoji;
            
            // Recalculate
            updateCalculator();
        });
    });

    // Initial calculation
    updateCalculator();
}

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
if (lenis) {
    lenis.on('scroll', (e) => {
        handleScrollEffects(e.scroll);
    });
}
// Throttled scroll handler for better performance
const throttledScrollEffects = throttle(() => {
    handleScrollEffects(window.pageYOffset);
}, 16); // ~60fps

window.addEventListener('scroll', throttledScrollEffects, passiveEvent);

// Smooth scrolling for navigation links - integrated with Locomotive
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            if (lenis) {
                const scrollTarget = (targetId === '#download') ? document.body.scrollHeight : target;
                lenis.scrollTo(scrollTarget, { offset: 0, duration: 1.0 });
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

// Optimized Statistics Counter System
function animateValue(element, start, end, duration, suffix = '') {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        // Easing function: easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        const currentValue = Math.floor(easeProgress * (end - start) + start);
        element.textContent = currentValue.toLocaleString() + suffix;
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.textContent = end.toLocaleString() + suffix;
        }
    };
    window.requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const stat = entry.target;
            const targetStr = stat.getAttribute('data-target') || stat.textContent;
            const numericValue = parseInt(targetStr.replace(/\D/g, ''));
            const suffix = targetStr.replace(/[\d,.]/g, '');
            
            if (!isNaN(numericValue)) {
                animateValue(stat, 0, numericValue, 2000, suffix);
            }
            statsObserver.unobserve(stat);
        }
    });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number, .hero-stat-number').forEach(stat => {
    statsObserver.observe(stat);
});



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

// Parallax effect for hero section - Throttled for performance
const heroParallax = throttle(() => {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    
    if (heroTitle) {
        heroTitle.style.transform = `translate3d(0, ${rate}px, 0)`; // GPU acceleration
    }
}, 16); // ~60fps

window.addEventListener('scroll', heroParallax, passiveEvent);

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

// Spline Hero Container - Static in Hero
const splineHeroContainer = document.querySelector('.spline-hero-container');
if (splineHeroContainer) {
    console.log('Spline Hero Container loaded - static in hero section!');
    
    // Make sure it's visible
    splineHeroContainer.style.opacity = '1';
    splineHeroContainer.style.visibility = 'visible';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('FinTrack Landing Page загредена успешно! 🚀');
    initFearOfLossSection();
});

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
function scrollToDownload(event) {
    if (event) event.preventDefault();
    const downloadSection = document.getElementById('download');
    if (downloadSection) {
        if (typeof lenis !== 'undefined' && lenis) {
            lenis.scrollTo(downloadSection, {
                offset: -50,
                duration: 1.0
            });
        } else {
            downloadSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
}

// Auto-attach scrollToDownload to ALL links that point to #download
function initAllDownloadLinks() {
    const downloadLinks = document.querySelectorAll('a[href="#download"], a[href$="#download"]');
    downloadLinks.forEach(link => {
        // Remove any existing onclick to avoid conflicts
        link.removeAttribute('onclick');
        link.addEventListener('click', function(e) {
            e.preventDefault();
            scrollToDownload(e);
        });
    });
    console.log(`✅ Attached scrollToDownload to ${downloadLinks.length} download links`);
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllDownloadLinks);
} else {
    initAllDownloadLinks();
}

// Add new keyframe animations via CSS (loss animations removed for performance)
const enhancedAnimationsCSS = `
@keyframes cardShock {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); box-shadow: 0 25px 50px rgba(255, 71, 87, 0.4); }
    100% { transform: scale(1); }
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
// COST OF INACTION TIMELINE SECTION
// ===================================

function initCostTimelineSection() {
    const timelineSection = document.querySelector('.cost-timeline-section');
    if (!timelineSection) return;

    const timelineItems = document.querySelectorAll('.timeline-item');
    const timelineCards = document.querySelectorAll('.timeline-card');
    const timelineLine = document.querySelector('.timeline-line');
    
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const itemObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'scale(1) translateY(0)';
                
                // Add extra animation to the card
                const card = entry.target.querySelector('.timeline-card');
                if (card) {
                    setTimeout(() => {
                        card.style.transform = 'translateY(0)';
                    }, 200);
                }
            }
        });
    }, observerOptions);

    // Observe all timeline items
    timelineItems.forEach(item => {
        itemObserver.observe(item);
    });

    // Animated line growth on scroll
    const lineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                timelineLine.style.animation = 'lineGrow 2s ease forwards';
            }
        });
    }, { threshold: 0.1 });

    if (timelineLine) {
        lineObserver.observe(timelineLine);
    }

    // Add hover effects to cards
    timelineCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-8px)';
            const glow = this.querySelector('.timeline-card-glow');
            if (glow) glow.style.opacity = '1';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            const glow = this.querySelector('.timeline-card-glow');
            if (glow) glow.style.opacity = '0';
        });
    });

    // Parallax effect on scroll (only on desktop)
    const isMobile = window.innerWidth < 768;
    let ticking = false;
    
    function updateParallax() {
        if (isMobile) return; // Skip parallax on mobile for better performance
        
        const scrollY = window.scrollY;
        const sectionTop = timelineSection.offsetTop;
        const sectionHeight = timelineSection.offsetHeight;
        const windowHeight = window.innerHeight;

        // Check if section is in viewport
        if (scrollY + windowHeight > sectionTop && scrollY < sectionTop + sectionHeight) {
            const relativeScroll = scrollY - sectionTop + windowHeight;
            const scrollPercent = relativeScroll / (sectionHeight + windowHeight);

            timelineItems.forEach((item, index) => {
                const speed = 0.3 + (index * 0.05);
                const offset = (scrollPercent * 50) * speed;
                const currentTransform = item.style.transform || '';
                // Preserve other transforms
                if (!currentTransform.includes('translateY')) {
                    item.style.transform += ` translateY(${-offset}px)`;
                }
            });
        }

        ticking = false;
    }

    if (!isMobile) {
        window.addEventListener('scroll', function() {
            if (!ticking) {
                window.requestAnimationFrame(updateParallax);
                ticking = true;
            }
        });
    }

    // Counter animation removed for performance - static values displayed

    // Smooth scroll for CTA button
    const ctaButton = document.querySelector('.timeline-cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function(e) {
            e.preventDefault();
            const targetSection = document.querySelector(this.getAttribute('href'));
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // Add pulse animation to markers
    const markers = document.querySelectorAll('.marker-pulse');
    markers.forEach((marker, index) => {
        marker.style.animationDelay = `${index * 0.2}s`;
    });

    // Mobile touch interactions
    if ('ontouchstart' in window) {
        timelineCards.forEach(card => {
            card.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(-8px) scale(0.98)';
            });

            card.addEventListener('touchend', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    console.log('Cost Timeline Section initialized');
}

// Initialize Cost Timeline Section
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCostTimelineSection);
} else {
    initCostTimelineSection();
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
    
    // Throttled progress update for better performance
    const throttledProgress = throttle(updateProgress, 16); // ~60fps
    window.addEventListener('scroll', throttledProgress, passiveEvent);
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




// Intersection Observer for Statistics Section (Main Stats)
const statsSection = document.querySelector('.stats-achievements-section');
if (statsSection) {
    const statsSectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                
                // Trigger counter animation for each child with attribute data-target
                const counterElements = entry.target.querySelectorAll('.stat-number-large');
                counterElements.forEach(el => {
                    const targetValue = parseInt(el.getAttribute('data-target'));
                    const currentText = el.textContent; // Original value might be statically in HTML or set to 0
                    
                    // Determine suffix (e.g. "+", "%")
                    let suffix = '';
                    if (targetValue === 200) suffix = '+';
                    if (targetValue === 40) suffix = '%';
                    if (targetValue === 100) suffix = '%';
                    
                    if (!isNaN(targetValue)) {
                        animateValue(el, 0, targetValue, 2000, suffix);
                    }
                });
                
                statsSectionObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });
    statsSectionObserver.observe(statsSection);
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
    let startY = 0;
    let currentY = 0;
    let isHorizontalDrag = null;
    
    function handleStart(e) {
        if (e.target.closest('.download-btn')) return; // Dont intercept clicks on buttons
        
        isDragging = true;
        startTime = Date.now();
        startX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        startY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        currentX = startX;
        currentY = startY;
        isHorizontalDrag = null;
        
        wrapper.classList.add('dragging');
        wrapper.style.transition = 'none';
    }
    
    // Touch/Mouse move
    function handleMove(e) {
        if (!isDragging) return;
        
        currentX = e.type.includes('mouse') ? e.pageX : e.touches[0].pageX;
        currentY = e.type.includes('mouse') ? e.pageY : e.touches[0].pageY;
        
        if (isHorizontalDrag === null) {
            isHorizontalDrag = Math.abs(currentX - startX) > Math.abs(currentY - startY);
        }
        
        if (!isHorizontalDrag) {
            isDragging = false;
            wrapper.classList.remove('dragging');
            updateCarousel(true);
            return;
        }
        
        if (e.cancelable) e.preventDefault();
        
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
        
        // Use Lenis
        if (typeof lenis !== 'undefined' && lenis) {
            this.isScrolling = true;
            lenis.scrollTo(targetSection, {
                duration: 1.2,
                onComplete: () => {
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

// Tubelight Navigation is disabled
// The user requested to not have mobile navigation, and the elements were removed from HTML

// ===================================
// HERO DESKTOP NAVIGATION - STATIC IN HERO
// ===================================

function initHeroDesktopNav() {
    const navItems = document.querySelectorAll('.nav-pill-item');
    const lamp = document.querySelector('.nav-pill-lamp');
    
    if (!navItems.length || !lamp) return;
    
    // Click handler for navigation items
    navItems.forEach((item, index) => {
        item.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            
            // If it's a real URL (like story.html), allow normal navigation
            if (targetId && !targetId.startsWith('#')) return;
            
            e.preventDefault();
            
            // Remove active from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active to clicked item
            this.classList.add('active');
            
            // Smooth scroll to section
            const targetSection = document.querySelector(targetId);
            
            if (targetSection && typeof lenis !== 'undefined' && lenis) {
                lenis.scrollTo(targetSection, {
                    duration: 1.0,
                    offset: 0
                });
            } else if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    console.log('🧭 Hero Desktop Navigation initialized (Static)!');
}

// Initialize hero desktop nav
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHeroDesktopNav);
} else {
    initHeroDesktopNav();
}

// ===================================
// MARKETING OVERLAY - SAVINGS MESSAGE
// ===================================

/**
 * Show marketing overlay with animation
 */
function showMarketingOverlay() {
    const overlay = document.getElementById('marketingOverlay');
    if (!overlay) {
        console.warn('Marketing overlay element not found');
        return;
    }
    
    // Add active class to trigger animation
    overlay.classList.add('active');
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'marketing_overlay_shown', {
            'event_category': 'marketing',
            'event_label': 'savings_message'
        });
    }
    
    console.log('💰 Marketing overlay shown!');
}

/**
 * Close marketing overlay with animation
 */
function closeMarketingOverlay() {
    const overlay = document.getElementById('marketingOverlay');
    if (!overlay) return;
    
    // Remove active class to trigger exit animation
    overlay.classList.remove('active');
    
    // Track event
    if (typeof gtag !== 'undefined') {
        gtag('event', 'marketing_overlay_closed', {
            'event_category': 'marketing',
            'event_label': 'savings_message'
        });
    }
    
    console.log('💰 Marketing overlay closed');
}

/**
 * Handle marketing CTA button click
 * Scrolls to download section and closes overlay
 */
function handleMarketingCTA() {
    // Close the overlay first
    closeMarketingOverlay();
    
    // Track CTA click
    if (typeof gtag !== 'undefined') {
        gtag('event', 'marketing_cta_clicked', {
            'event_category': 'marketing',
            'event_label': 'download_from_savings_message'
        });
    }
    
    // Wait for close animation to complete, then scroll
    setTimeout(() => {
        const downloadSection = document.getElementById('download');
        if (downloadSection) {
            // Use Lenis Scroll if available
            if (typeof lenis !== 'undefined' && lenis) {
                lenis.scrollTo(downloadSection, {
                    duration: 1.2,
                    offset: -50
                });
            } else {
                // Fallback to native smooth scroll
                downloadSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    }, 400); // Match the exit animation duration
    
    console.log('💰 Marketing CTA clicked - scrolling to download');
}

/**
 * Initialize marketing overlay
 * Shows overlay after 2.5 seconds delay
 */
function initMarketingOverlay() {
    const overlay = document.getElementById('marketingOverlay');
    if (!overlay) {
        console.warn('Marketing overlay element not found');
        return;
    }
    
    // Show overlay after 2.5 seconds
    setTimeout(() => {
        showMarketingOverlay();
    }, 2500);
    
    // Optional: Close on click outside card
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeMarketingOverlay();
        }
    });
    
    console.log('💰 Marketing overlay initialized - will show in 2.5s');
}

// Initialize marketing overlay when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMarketingOverlay);
} else {
    initMarketingOverlay();
}


// ============================================
// FAQ ACCORDION FUNCTIONALITY
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', function() {
            // Close other open items
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
        });
    });
});

// ============================================
// SCROLL TO DOWNLOAD FUNCTION
// ============================================
function scrollToDownload() {
    const downloadSection = document.getElementById('download');
    if (downloadSection) {
        downloadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return false;
}

// ============================================
// FOOTER MODAL LISTENERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const helpCenterLink = document.getElementById('footer-help-center');
    if (helpCenterLink) {
        helpCenterLink.addEventListener('click', function(e) {
            e.preventDefault();
            openHelpCenter();
        });
    }
    
    const contactUsLink = document.getElementById('footer-contact-us');
    if (contactUsLink) {
        contactUsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openContactModal();
        });
    }
    
    const feedbackLink = document.getElementById('footer-feedback');
    if (feedbackLink) {
        feedbackLink.addEventListener('click', function(e) {
            e.preventDefault();
            openFeedbackModal();
        });
    }
});

// ============================================
// OBJECTIONS ACCORDION FUNCTIONALITY
// ============================================
function toggleObjection(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');
    
    // Close all other items in this section
    const section = item.closest('.objections-section');
    if (section) {
        section.querySelectorAll('.objection-item').forEach(el => {
            el.classList.remove('active');
        });
    }
    
    // Toggle current item
    if (!isActive) {
        item.classList.add('active');
    }
    
    // Refresh Lenis if active
    if (typeof lenis !== 'undefined' && lenis) {
        setTimeout(() => {
            lenis.resize();
        }, 400);
    }
}

