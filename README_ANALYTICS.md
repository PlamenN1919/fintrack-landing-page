# 📊 FinTrack Analytics System

Пълна интеграция на analytics система за FinTrack Landing Page с real-time проследяване и защитен admin dashboard.

## 🎯 Функционалности

### Backend (Python Flask + PostgreSQL)
- ✅ RESTful API за tracking events
- ✅ WebSocket сървър за real-time updates
- ✅ PostgreSQL база данни с 4 таблици
- ✅ Admin authentication система
- ✅ GDPR compliance (IP анонимизация, cookie consent)
- ✅ Rate limiting и security защити
- ✅ Auto cleanup на стари данни (90 дни retention)

### Frontend Tracking
- ✅ Universal tracking script с session management
- ✅ Автоматично проследяване на page visits
- ✅ Click tracking чрез `data-track-id` атрибути
- ✅ Cookie consent banner (GDPR compliant)
- ✅ Batch sending за оптимизация
- ✅ Auto-retry при network грешки

### Admin Dashboard
- ✅ Защитен login с password authentication
- ✅ Real-time dashboard с 4 summary cards:
  - Посещения за последните 24ч
  - Кликвания за последните 24ч
  - Активни потребители (live)
  - Conversion rate
- ✅ 3 интерактивни графики (Chart.js):
  - Line chart - Трафик по дни (30 дни)
  - Bar chart - Топ 10 clicked buttons
  - Doughnut chart - Traffic sources
- ✅ Real-time events таблица с:
  - Филтриране (All/Visits/Clicks)
  - Live updates чрез WebSocket
  - Последните 50 събития
- ✅ Dark mode професионален дизайн
- ✅ Fully responsive (mobile + desktop)

## 📁 Файлова структура

```
FinTrack Landing page/
│
├── 📂 backend/                          # Flask Backend
│   ├── app.py                          # Main Flask application
│   ├── models.py                       # SQLAlchemy database models
│   ├── auth.py                         # Authentication utilities
│   ├── config.py                       # Configuration management
│   ├── database.sql                    # PostgreSQL schema
│   ├── requirements.txt                # Python dependencies
│   ├── .env.example                    # Environment variables template
│   └── README.md                       # Backend documentation
│
├── 📂 admin/                            # Admin Dashboard
│   ├── index.html                      # Login page
│   ├── dashboard.html                  # Main dashboard
│   ├── admin.css                       # Dashboard styles
│   └── admin.js                        # Dashboard JavaScript
│
├── 📂 assets/js/                        # Frontend Scripts
│   ├── tracking.js                     # Universal tracking script
│   └── cookie-consent.js               # GDPR cookie banner
│
├── index.html                           # Landing page (tracking integrated)
├── ANALYTICS_SETUP.md                   # Deployment guide
└── README_ANALYTICS.md                  # This file
```

## 🚀 Quick Start

### 1. Database Setup

```bash
createdb fintrack_analytics
psql -d fintrack_analytics -f backend/database.sql
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python auth.py yourPassword123  # Generate password hash
python app.py
```

### 3. Configure Frontend

Редактирайте API URL в `index.html`:

```javascript
window.ANALYTICS_API_URL = 'http://localhost:5000/api';
```

### 4. Access Admin Dashboard

Отворете `http://localhost:5000/admin/` и влезте с парола.

## 📊 Tracked Events

След интеграцията, следните действия се проследяват автоматично:

| Event ID | Description | Location |
|----------|-------------|----------|
| `download-ios` | iOS App Download Button | Download Section |
| `download-android` | Android App Download Button | Download Section |
| `pain-calculator` | Pain Calculator Button | Pain Section |
| `stop-losses-cta` | Stop Losses CTA | Results Section |

### Добавяне на нови tracked buttons

```html
<button data-track-id="my-button" data-track-label="My Custom Button">
    Click Me
</button>
```

## 🔒 Security Features

- ✅ **IP Anonymization**: SHA256 hash на IP адреси
- ✅ **Password Hashing**: bcrypt с salt
- ✅ **Session Management**: Secure HTTP-only cookies
- ✅ **CORS Protection**: Whitelist domains
- ✅ **Rate Limiting**: 100 req/min per IP
- ✅ **SQL Injection Protection**: SQLAlchemy ORM
- ✅ **GDPR Compliance**: Cookie consent + data retention

## 📈 Admin Dashboard Features

### Summary Cards
- Real-time metrics update every 30 seconds
- Trend indicators (up/down arrows)
- Color-coded icons

### Charts
- **Visits Chart**: Last 30 days traffic trend
- **Buttons Chart**: Top 10 most clicked buttons
- **Sources Chart**: Traffic source distribution

### Events Table
- Real-time updates via WebSocket
- Filter by type (All/Visits/Clicks)
- Shows last 50 events
- Responsive design

### Real-time Updates
- WebSocket connection indicator
- Auto-reconnect on disconnect
- Live notification of new events
- Active users count updates every 30s

## 🛠️ Technology Stack

### Backend
- **Framework**: Flask 3.0
- **Database**: PostgreSQL 15+
- **ORM**: SQLAlchemy 2.0
- **WebSocket**: Flask-SocketIO + eventlet
- **Auth**: bcrypt + werkzeug
- **Environment**: python-dotenv

### Frontend
- **Tracking**: Vanilla JavaScript
- **Charts**: Chart.js 4.0
- **UI**: Custom CSS (Dark mode)
- **Icons**: Font Awesome 6.4
- **WebSocket**: Socket.IO Client

### Database
- **RDBMS**: PostgreSQL
- **Tables**: 4 (visits, clicks, sessions, consents)
- **Indexes**: Optimized for queries
- **Cleanup**: Auto-delete after 90 days

## 📱 API Endpoints

### Public (Tracking)
```
POST /api/track/visit          # Track page visit
POST /api/track/click          # Track button click
POST /api/track/consent        # Track cookie consent
GET  /api/health               # Health check
```

### Admin (Protected)
```
POST /api/auth/login           # Admin login
POST /api/auth/logout          # Admin logout
GET  /api/auth/check           # Check auth status
GET  /api/stats/summary        # Summary statistics
GET  /api/stats/chart-data     # Chart data
GET  /api/events/recent        # Recent events
```

### WebSocket Events
```
connect                        # Client connected
disconnect                     # Client disconnected
ping                          # Keep-alive ping
new_visit                     # New visit (broadcast)
new_click                     # New click (broadcast)
active_users_update           # Active users count
```

## 🌐 Deployment Options

### Cloud Platforms
- ✅ **Railway** - Recommended (easy PostgreSQL)
- ✅ **Render** - Free tier available
- ✅ **Heroku** - Classic option
- ✅ **AWS/GCP** - For advanced users

### Frontend Hosting
- ✅ **Netlify** - Recommended (easy deploy)
- ✅ **Vercel** - Fast edge network
- ✅ **GitHub Pages** - Free static hosting
- ✅ **Cloudflare Pages** - Fast CDN

Пълни deployment инструкции: вижте `ANALYTICS_SETUP.md`

## 📊 Sample SQL Queries

### Get visits by hour (today)
```sql
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    COUNT(*) as visits
FROM page_visits
WHERE created_at > CURRENT_DATE
GROUP BY hour
ORDER BY hour DESC;
```

### Get conversion funnel
```sql
SELECT 
    (SELECT COUNT(*) FROM page_visits WHERE created_at > NOW() - INTERVAL '24 hours') as visits,
    (SELECT COUNT(*) FROM click_events WHERE created_at > NOW() - INTERVAL '24 hours') as clicks,
    (SELECT COUNT(*) FROM click_events WHERE button_id = 'download-ios' AND created_at > NOW() - INTERVAL '24 hours') as ios_downloads,
    (SELECT COUNT(*) FROM click_events WHERE button_id = 'download-android' AND created_at > NOW() - INTERVAL '24 hours') as android_downloads;
```

### Get active sessions by page
```sql
SELECT 
    page_url,
    COUNT(*) as active_users
FROM active_sessions
WHERE last_seen > NOW() - INTERVAL '5 minutes'
GROUP BY page_url
ORDER BY active_users DESC;
```

## 🔧 Configuration

### Environment Variables

```env
# Flask
FLASK_ENV=production
SECRET_KEY=<your-secret-key>

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db

# Admin
ADMIN_PASSWORD_HASH=<bcrypt-hash>

# CORS
CORS_ORIGINS=https://yourdomain.com

# Analytics
DATA_RETENTION_DAYS=90
ACTIVE_SESSION_TIMEOUT=5
GDPR_ENABLED=true
IP_ANONYMIZATION=true
```

## 🧪 Testing

### Test Backend
```bash
cd backend
python -m pytest  # Run tests
python app.py     # Start server
curl http://localhost:5000/api/health
```

### Test Tracking
1. Open index.html in browser
2. Open Console (F12)
3. Look for "✅ FinTrack Analytics initialized"
4. Click tracked button
5. Check Network tab for POST requests

### Test Admin Dashboard
1. Open /admin/
2. Login with password
3. Verify stats load
4. Check WebSocket indicator
5. Click button on landing page
6. Verify real-time update in dashboard

## 📝 Maintenance

### Daily Tasks
- ✅ Check admin dashboard for anomalies
- ✅ Monitor active users count
- ✅ Review top clicked buttons

### Weekly Tasks
- ✅ Review traffic trends
- ✅ Check conversion rates
- ✅ Optimize underperforming buttons

### Monthly Tasks
- ✅ Backup database
- ✅ Review GDPR compliance
- ✅ Update analytics based on insights
- ✅ Clean up old data (automatic)

## 🐛 Common Issues

### Issue: Tracking not working
**Solution**: Check console for errors, verify API_URL, check CORS settings

### Issue: Admin login fails
**Solution**: Verify ADMIN_PASSWORD_HASH in .env, regenerate with auth.py

### Issue: WebSocket not connecting
**Solution**: Check WS_URL, ensure Socket.IO client loaded, verify firewall

### Issue: Charts not displaying
**Solution**: Check API responses, verify Chart.js loaded, check browser console

## 📚 Documentation

- **Deployment Guide**: `ANALYTICS_SETUP.md`
- **Backend Docs**: `backend/README.md`
- **API Reference**: See backend/app.py docstrings
- **Database Schema**: `backend/database.sql`

## 🎓 Learning Resources

- **Flask**: https://flask.palletsprojects.com/
- **SQLAlchemy**: https://www.sqlalchemy.org/
- **Chart.js**: https://www.chartjs.org/
- **Socket.IO**: https://socket.io/docs/
- **PostgreSQL**: https://www.postgresql.org/docs/

## ✅ Completion Checklist

- [x] Database schema created
- [x] Flask backend implemented
- [x] Authentication system setup
- [x] Tracking scripts created
- [x] Cookie consent banner added
- [x] Admin login page built
- [x] Admin dashboard implemented
- [x] WebSocket real-time updates
- [x] Charts integration (Chart.js)
- [x] Tracking integrated in index.html
- [x] Documentation completed

## 🎉 Summary

Имплементирана е пълна analytics система с:

- ✅ **Backend**: Python Flask + PostgreSQL + WebSocket
- ✅ **Frontend**: Universal tracking + GDPR banner
- ✅ **Admin**: Protected dashboard с real-time updates
- ✅ **Security**: GDPR compliant, secure, rate limited
- ✅ **Deploy Ready**: Documentation за всички platforms

**Системата е готова за production deployment!** 🚀

---

**Created by**: Cursor AI Assistant  
**Date**: December 2024  
**Version**: 1.0.0  
**License**: MIT

