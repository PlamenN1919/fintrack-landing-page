# Системни шаблони - FinTrack Landing Page

## Архитектурни решения

### 1. Статичен Frontend + API Backend (JAMstack подход)

**Защо този подход:**
- Максимална производителност (CDN caching)
- Лесно scaling (frontend и backend независими)
- По-добра сигурност (API е отделен)
- По-евтино hosting (static hosting е безплатен)

**Имплементация:**
```
Frontend (Vercel) ←→ Backend API (Railway) ←→ PostgreSQL (Railway)
```

### 2. Progressive Enhancement

**Принцип:** Сайтът работи без JavaScript, но е по-добър с него.

**Имплементация:**
- Основно съдържание е в HTML
- CSS осигурява стилове
- JavaScript добавя интерактивност
- Fallbacks за всички модерни features

### 3. Performance-First подход

**Стратегия:**
- Критичен CSS inline в `<head>`
- Defer/async за всички external ресурси
- Lazy loading за изображения
- Resource hints (prefetch, preconnect)
- GPU acceleration за анимации

### 4. Mobile-First Responsive Design

**Breakpoints:**
```css
/* Mobile: 320px - 767px (default) */
/* Tablet: 768px - 1023px */
@media (min-width: 768px) { ... }

/* Desktop: 1024px+ */
@media (min-width: 1024px) { ... }

/* Large Desktop: 1440px+ */
@media (min-width: 1440px) { ... }
```

## Design Patterns

### 1. Bento Grid Layout

**Използване:** Features секция

**Характеристики:**
- CSS Grid с асиметрични размери
- Различни card sizes (large, medium, wide, small)
- Responsive collapse на mobile

**Код структура:**
```html
<div class="bento-grid">
  <div class="bento-card large">...</div>
  <div class="bento-card medium">...</div>
  <div class="bento-card wide">...</div>
</div>
```

### 2. Glassmorphism Effect

**Използване:** Navigation, cards, modals

**CSS Pattern:**
```css
.glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### 3. Reveal Animations (Intersection Observer)

**Pattern:**
```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('section-visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
```

**CSS:**
```css
.reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.section-visible {
  opacity: 1;
  transform: translateY(0);
}
```

### 4. Staggered Animations

**Pattern:**
```css
.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.stagger-children.section-visible > *:nth-child(1) { transition-delay: 0.1s; }
.stagger-children.section-visible > *:nth-child(2) { transition-delay: 0.2s; }
.stagger-children.section-visible > *:nth-child(3) { transition-delay: 0.3s; }
```

## JavaScript Patterns

### 1. Throttle Function (Performance)

**Използване:** Scroll events, resize events

```javascript
function throttle(func, wait) {
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

// Usage
window.addEventListener('scroll', throttle(() => {
  // Heavy operation
}, 100));
```

### 2. Debounce Function (Performance)

**Използване:** Input events, window resize

```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
```

### 3. Passive Event Listeners

**Pattern:**
```javascript
window.addEventListener('scroll', handleScroll, { passive: true });
window.addEventListener('touchstart', handleTouch, { passive: true });
```

**Защо:** Подобрява scroll performance на 30-40%

### 4. Module Pattern (Analytics)

**Pattern:**
```javascript
(function() {
  'use strict';
  
  // Private variables
  let sessionId = null;
  
  // Private functions
  function init() { ... }
  
  // Public API
  window.FinTrackAnalytics = {
    trackEvent: trackEvent,
    setConsent: setConsent
  };
  
  // Auto-init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

## CSS Patterns

### 1. CSS Custom Properties (Variables)

**Pattern:**
```css
:root {
  /* Colors */
  --primary-color: #667eea;
  --text-dark: #2c2c2c;
  --bg-light: #E8E4E4;
  
  /* Spacing */
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-size-base: 16px;
}
```

### 2. BEM-like Naming Convention

**Pattern:**
```css
.hero { }                    /* Block */
.hero__title { }             /* Element */
.hero__title--large { }      /* Modifier */
```

**Пример:**
```html
<section class="hero">
  <h1 class="hero__title hero__title--large">FinTrack</h1>
  <p class="hero__subtitle">Управлявай финансите си</p>
</section>
```

### 3. GPU Acceleration Pattern

**Pattern:**
```css
.animated-element {
  will-change: transform, opacity;
  transform: translate3d(0, 0, 0); /* Force GPU */
  backface-visibility: hidden;
}

/* Animation */
.animated-element:hover {
  transform: translate3d(0, -10px, 0); /* Use translate3d */
}
```

### 4. Content Visibility (Performance)

**Pattern:**
```css
.off-screen-section {
  content-visibility: auto;
  contain-intrinsic-size: 0 500px;
}
```

**Ефект:** Browser не рендерира off-screen съдържание

## Backend Patterns

### 1. Configuration Pattern

**Pattern:**
```python
class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'default')
    
class DevelopmentConfig(Config):
    DEBUG = True
    
class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig
}
```

### 2. Database Models (SQLAlchemy)

**Pattern:**
```python
class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.String(36), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    visits = db.relationship('PageVisit', backref='session', lazy=True)
```

### 3. API Response Pattern

**Pattern:**
```python
@app.route('/api/endpoint', methods=['POST'])
def endpoint():
    try:
        data = request.get_json()
        # Process data
        return jsonify({'success': True, 'data': result}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400
```

### 4. CORS Configuration

**Pattern:**
```python
CORS(app, resources={
    r"/api/*": {
        "origins": Config.CORS_ORIGINS,
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

### 5. Rate Limiting Pattern

**Pattern:**
```python
limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per minute"]
)

@app.route('/api/track/click', methods=['POST'])
@limiter.limit("50 per minute")
def track_click():
    # Handle request
```

## Analytics Patterns

### 1. Session Management

**Pattern:**
- Generate UUID v4 для session ID
- Store в localStorage
- 30-minute timeout
- Auto-refresh на activity

### 2. Event Batching

**Pattern:**
```javascript
let eventQueue = [];

function queueEvent(data) {
  eventQueue.push(data);
  
  if (eventQueue.length >= 10) {
    flushQueue();
  } else {
    scheduleFlush(5000); // 5 seconds
  }
}
```

**Защо:** Намалява API calls с 80%

### 3. GDPR Consent Pattern

**Pattern:**
```javascript
function checkConsent() {
  const consent = localStorage.getItem('cookie_consent');
  if (!consent) {
    showConsentBanner();
    queueEvents(); // Queue до consent
  } else {
    sendEvents(); // Send веднага
  }
}
```

### 4. Heatmap Tracking

**Pattern:**
```javascript
document.addEventListener('click', (e) => {
  const data = {
    x: e.clientX,
    y: e.clientY + window.scrollY,
    viewport_width: window.innerWidth,
    element: getElementSelector(e.target)
  };
  
  heatmapQueue.push(data);
  
  if (heatmapQueue.length >= 5) {
    flushHeatmap();
  }
});
```

## Deployment Patterns

### 1. Environment-based Configuration

**Pattern:**
```javascript
const CONFIG = {
  apiUrl: window.ANALYTICS_API_URL || 
          (window.location.hostname === 'localhost' 
            ? 'http://localhost:5000/api' 
            : '/api')
};
```

### 2. Health Check Endpoint

**Pattern:**
```python
@app.route('/health', methods=['GET'])
def health_check():
    try:
        # Check database
        db.session.execute('SELECT 1')
        return jsonify({'status': 'healthy'}), 200
    except:
        return jsonify({'status': 'unhealthy'}), 503
```

### 3. Graceful Error Handling

**Pattern:**
```javascript
async function sendRequest(endpoint, data) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.warn(`Request failed: ${response.status}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.warn('Network error:', error);
    return false;
  }
}
```

## Security Patterns

### 1. Password Hashing

**Pattern:**
```python
import bcrypt

def hash_password(password):
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')

def verify_password(password, hash):
    return bcrypt.checkpw(
        password.encode('utf-8'), 
        hash.encode('utf-8')
    )
```

### 2. IP Anonymization (GDPR)

**Pattern:**
```python
def anonymize_ip(ip_address):
    if ':' in ip_address:  # IPv6
        parts = ip_address.split(':')
        return ':'.join(parts[:4]) + '::0'
    else:  # IPv4
        parts = ip_address.split('.')
        return '.'.join(parts[:3]) + '.0'
```

### 3. Session Security

**Pattern:**
```python
app.config.update(
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=True,  # HTTPS only
    SESSION_COOKIE_SAMESITE='Lax',
    PERMANENT_SESSION_LIFETIME=timedelta(hours=12)
)
```

## Naming Conventions

### Files
- `kebab-case.html` - HTML files
- `kebab-case.css` - CSS files
- `kebab-case.js` - JavaScript files
- `PascalCase.md` - Documentation

### CSS Classes
- `.block-name` - Component
- `.block-name__element` - Element
- `.block-name--modifier` - Variant

### JavaScript
- `camelCase` - Variables, functions
- `PascalCase` - Classes, constructors
- `UPPER_SNAKE_CASE` - Constants

### Python
- `snake_case` - Functions, variables
- `PascalCase` - Classes
- `UPPER_SNAKE_CASE` - Constants

## Code Organization Principles

### 1. Separation of Concerns
- HTML: Structure
- CSS: Presentation
- JavaScript: Behavior

### 2. DRY (Don't Repeat Yourself)
- Reusable CSS classes
- JavaScript utility functions
- Backend helper functions

### 3. KISS (Keep It Simple, Stupid)
- Vanilla JavaScript (no framework overhead)
- Simple Flask backend
- Straightforward database schema

### 4. Progressive Enhancement
- Core functionality без JavaScript
- Enhanced experience с JavaScript
- Graceful degradation

## Performance Best Practices

### 1. Critical Rendering Path
1. Inline critical CSS
2. Defer non-critical CSS
3. Defer all JavaScript
4. Lazy load images

### 2. Resource Loading Priority
1. HTML (highest)
2. Critical CSS (inline)
3. Fonts (preload)
4. Images (lazy)
5. JavaScript (defer)
6. Analytics (async)

### 3. Animation Performance
- Use `transform` and `opacity` only
- Avoid `width`, `height`, `top`, `left`
- Use `will-change` sparingly
- Use GPU acceleration (`translate3d`)

### 4. Network Optimization
- Minimize HTTP requests
- Use CDN for external resources
- Enable compression (gzip/brotli)
- Implement caching headers

## Testing Patterns

### Manual Testing Checklist
- ✅ Desktop browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)
- ✅ Responsive breakpoints (320px, 768px, 1024px, 1440px)
- ✅ Cookie consent flow
- ✅ Analytics tracking
- ✅ Admin panel
- ✅ Performance (Lighthouse)

### Browser Console Testing
```javascript
// Test analytics
FinTrackAnalytics.trackEvent('test_event', { test: true });

// Check session
console.log(FinTrackAnalytics.getSessionId());

// Check consent
console.log(FinTrackAnalytics.getConsent());
```

## Maintenance Patterns

### 1. Version Control
- Meaningful commit messages
- Feature branches
- Regular pushes to GitHub

### 2. Documentation
- Memory Bank files
- Inline code comments
- README files
- Deployment guides

### 3. Monitoring
- Railway logs (backend)
- Vercel analytics (frontend)
- Custom analytics dashboard
- Error tracking

### 4. Updates
- Regular dependency updates
- Security patches
- Performance improvements
- Feature additions

## Future Patterns to Consider

### 1. Component-based Architecture
- Web Components
- Reusable UI elements
- Shadow DOM encapsulation

### 2. State Management
- Centralized state
- Redux-like pattern
- Event-driven updates

### 3. API Versioning
- `/api/v1/` endpoints
- Backward compatibility
- Deprecation notices

### 4. Advanced Analytics
- A/B testing framework
- User segmentation
- Cohort analysis
- Funnel optimization




