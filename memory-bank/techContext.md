# Технически контекст - FinTrack Landing Page

## Технологичен стек

### Frontend
- **HTML5** - Semantic markup, accessibility features
- **CSS3** - Modern features (Grid, Flexbox, Custom Properties)
- **Vanilla JavaScript** - No framework dependencies
- **Locomotive Scroll** - Smooth scrolling library (v4.1.4)
- **Spline 3D** - 3D визуализации (v1.12.6)
- **Font Awesome** - Icons (v6.4.0)
- **Google Fonts** - Inter font family

### Backend
- **Python 3.11+** - Runtime
- **Flask** - Web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Gunicorn** - WSGI server
- **bcrypt** - Password hashing
- **Flask-CORS** - CORS handling
- **Flask-Limiter** - Rate limiting

### Deployment
- **Frontend:** Vercel (Static hosting)
- **Backend:** Railway (Container platform)
- **Database:** PostgreSQL на Railway
- **Domain:** fintrackwallet.com (jump.bg)
- **SSL:** Automatic (Vercel)

## Архитектура

```
┌─────────────────────────────────────────────┐
│         fintrackwallet.com (Vercel)         │
│                                             │
│  - Static HTML/CSS/JS                       │
│  - CDN distribution                         │
│  - Automatic SSL                            │
│  - Edge caching                             │
└──────────────┬──────────────────────────────┘
               │
               │ HTTPS API Calls
               │
┌──────────────▼──────────────────────────────┐
│      Backend API (Railway)                  │
│                                             │
│  - Flask REST API                           │
│  - Rate limiting                            │
│  - CORS protection                          │
│  - GDPR compliance                          │
└──────────────┬──────────────────────────────┘
               │
               │ PostgreSQL Connection
               │
┌──────────────▼──────────────────────────────┐
│      PostgreSQL Database (Railway)          │
│                                             │
│  - User sessions                            │
│  - Analytics events                         │
│  - Click tracking                           │
│  - Heatmap data                             │
└─────────────────────────────────────────────┘
```

## Файлова структура

```
/
├── index.html                  # Main landing page
├── styles.css                  # Main styles
├── styles.min.css              # Minified styles
├── performance-optimizations.css # Performance CSS
├── script.js                   # Main JavaScript
├── script.min.js               # Minified JavaScript
├── vercel.json                 # Vercel configuration
│
├── assets/
│   ├── backgrounds/            # Background images
│   │   └── optimized/          # Responsive versions
│   ├── logos/                  # Logo files
│   │   └── optimized/          # Multiple sizes
│   ├── mockups/                # Phone mockups
│   │   └── optimized/          # Responsive versions
│   └── js/
│       ├── tracking.js         # Analytics tracking
│       └── cookie-consent.js   # GDPR cookie consent
│
├── backend/
│   ├── app.py                  # Main Flask app
│   ├── config.py               # Configuration
│   ├── models.py               # Database models
│   ├── auth.py                 # Authentication
│   ├── database.sql            # Database schema
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile                # Railway start command
│   └── railway.json            # Railway configuration
│
├── admin/
│   ├── index.html              # Admin login
│   ├── dashboard.html          # Analytics dashboard
│   ├── admin.css               # Admin styles
│   └── admin.js                # Admin JavaScript
│
└── memory-bank/                # Project documentation
    ├── projectbrief.md
    ├── productContext.md
    ├── activeContext.md
    ├── systemPatterns.md
    ├── techContext.md
    └── progress.md
```

## Development Setup

### Prerequisites
- Python 3.11+
- Node.js (optional, за minification)
- Git
- PostgreSQL (за локално тестване)

### Локален Development

**Frontend:**
```bash
cd "/Users/nikolovp/Documents/FinTrack Landing page"
python3 -m http.server 8000
# Отвори: http://localhost:8000
```

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
python app.py
# API на: http://localhost:5000
```

### Environment Variables

**Backend (.env):**
```env
FLASK_ENV=development
SECRET_KEY=dev-secret-key
DATABASE_URL=postgresql://localhost/fintrack_analytics
CORS_ORIGINS=http://localhost:8000,http://localhost:3000
ADMIN_PASSWORD_HASH=<hash-from-auth.py>
REDIS_URL=memory://
DATA_RETENTION_DAYS=90
ACTIVE_SESSION_TIMEOUT=5
GDPR_ENABLED=true
IP_ANONYMIZATION=true
```

**Frontend (Vercel Environment Variables):**
```env
ANALYTICS_API_URL=https://<railway-backend-url>/api
```

## Performance Optimizations

### Implemented
- ✅ Image optimization (srcset, lazy loading)
- ✅ CSS minification и inline critical CSS
- ✅ JavaScript defer loading
- ✅ Resource hints (prefetch, preconnect, preload)
- ✅ GPU acceleration за animations
- ✅ Throttled scroll listeners
- ✅ Passive event listeners
- ✅ Content-visibility за off-screen елементи

### Metrics
- First Contentful Paint: ~1.2s
- Largest Contentful Paint: ~2.5s
- Total Blocking Time: <200ms
- Cumulative Layout Shift: <0.1
- Image size reduction: 83% (4.5MB → 788KB)

## Security Features

### GDPR Compliance
- Cookie consent banner
- IP anonymization
- Data retention policy (90 days)
- User opt-out capability
- Privacy policy

### Security Headers
- CORS protection
- Rate limiting (100 requests/minute)
- Secure session cookies
- HTTPS only (production)
- bcrypt password hashing

### Admin Protection
- Password authentication
- Session management
- Admin-only routes
- CSRF protection

## API Endpoints

### Public Endpoints
- `POST /api/track/visit` - Track page visit
- `POST /api/track/click` - Track button click
- `POST /api/track/consent` - Track cookie consent
- `POST /api/track/page-exit` - Track page exit
- `POST /api/track/heatmap` - Track heatmap clicks
- `POST /api/track/conversion` - Track conversion events
- `GET /health` - Health check

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/stats` - Get analytics stats
- `GET /api/admin/events` - Get event list
- `GET /api/admin/heatmap` - Get heatmap data
- `GET /api/admin/funnel` - Get conversion funnel

## Database Schema

### Tables
- `sessions` - User sessions
- `page_visits` - Page view tracking
- `button_clicks` - Click tracking
- `heatmap_clicks` - Heatmap data
- `conversion_events` - Conversion funnel
- `consent_logs` - GDPR consent tracking

## Deployment Configuration

### Vercel (vercel.json)
```json
{
  "buildCommand": null,
  "outputDirectory": ".",
  "installCommand": null
}
```

### Railway (railway.json)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "gunicorn -w 2 --bind 0.0.0.0:$PORT --timeout 120 --log-level info app:app",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### Railway Procfile
```
web: gunicorn -w 2 --bind 0.0.0.0:$PORT --timeout 120 --log-level info app:app
release: python -c "from app import db; db.create_all()"
```

## Browser Support

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

### Progressive Enhancement
- Fallbacks за CSS Grid → Flexbox
- Fallbacks за backdrop-filter
- Fallbacks за CSS custom properties
- JavaScript не е задължителен за основно съдържание

## Known Limitations

### Current Constraints
- Spline 3D може да е бавен на стари устройства
- Locomotive Scroll не работи на iOS < 14
- Admin панел не е mobile-optimized
- Analytics не работи без JavaScript

### Future Improvements
- Server-side rendering (SSR)
- Progressive Web App (PWA)
- Offline support
- Advanced analytics (A/B testing)
- Multi-language support

## Dependencies

### Frontend (CDN)
- Locomotive Scroll: 4.1.4
- Spline Viewer: 1.12.6
- Font Awesome: 6.4.0
- Google Fonts: Inter

### Backend (requirements.txt)
```
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
psycopg2-binary==2.9.9
SQLAlchemy==2.0.23
bcrypt==4.1.1
python-dotenv==1.0.0
gunicorn==21.2.0
```

## Monitoring & Logging

### Production Monitoring
- Railway logs (backend)
- Vercel analytics (frontend)
- Custom analytics dashboard (admin panel)

### Key Metrics
- Page views
- Active sessions
- Click tracking
- Conversion funnel
- Heatmap data
- Error rates

## Backup & Recovery

### Automated Backups
- Railway PostgreSQL: Daily automatic backups
- GitHub: Source code version control
- Vercel: Automatic deployment history

### Manual Backup
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Import database
psql $DATABASE_URL < backup.sql
```

## Contact & Support

### Development
- GitHub: PlamenN1919/fintrack-landing-page
- Email: fintrackk@gmail.com

### Hosting Support
- Vercel: https://vercel.com/support
- Railway: https://railway.app/help
- jump.bg: support@jump.bg




