# FinTrack Analytics - Setup Guide

Пълна система за analytics с real-time проследяване и admin dashboard.

## 📋 Какво е имплементирано

### ✅ Backend (Python Flask)
- **Database**: PostgreSQL schema с 4 таблици (page_visits, click_events, active_sessions, cookie_consents)
- **API Endpoints**: 
  - `/api/track/visit` - Проследяване на посещения
  - `/api/track/click` - Проследяване на кликвания
  - `/api/stats/*` - Статистики за dashboard
  - `/api/auth/*` - Admin authentication
- **WebSocket Server**: Real-time updates към admin panel
- **GDPR Compliance**: IP анонимизация, cookie consent tracking, 90 дни retention

### ✅ Frontend Tracking
- **Universal Tracking Script** (`assets/js/tracking.js`)
- **Cookie Consent Banner** (`assets/js/cookie-consent.js`)
- **Автоматично проследяване**:
  - Page visits при зареждане
  - Click events чрез `data-track-id` атрибути
  - Session management
  
### ✅ Admin Dashboard
- **Login система** (`/admin/index.html`)
- **Dashboard** (`/admin/dashboard.html`) с:
  - Summary cards (Посещения, Кликвания, Активни потребители, Conversion Rate)
  - 3 графики (Chart.js): Трафик по дни, Топ бутони, Traffic sources
  - Real-time events таблица
  - WebSocket live updates
  - Dark mode професионален дизайн

### ✅ Интеграция
- Tracking скриптове добавени в `index.html`
- Key buttons имат `data-track-id` атрибути:
  - `download-ios` - iOS download бутон
  - `download-android` - Android download бутон
  - `pain-calculator` - Pain calculator бутон
  - `stop-losses-cta` - Stop losses CTA

## 🚀 Deployment Guide

### 1. Database Setup (PostgreSQL)

#### Option A: Local PostgreSQL

```bash
# Създайте база данни
createdb fintrack_analytics

# Изпълнете schema
psql -d fintrack_analytics -f backend/database.sql
```

#### Option B: Cloud PostgreSQL (Railway/Render/Supabase)

1. Създайте PostgreSQL instance
2. Копирайте DATABASE_URL
3. Изпълнете SQL schema през pgAdmin или psql

### 2. Backend Setup

```bash
cd backend

# Създайте virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Инсталирайте dependencies
pip install -r requirements.txt

# Конфигурация
cp .env.example .env
nano .env  # Редактирайте настройките
```

#### Генериране на Admin парола

```bash
python auth.py yourSecurePassword123
# Копирайте hash-а в .env файла
```

#### Конфигурация на .env файл

```env
FLASK_ENV=production
SECRET_KEY=your-secret-key-here-change-in-production
DATABASE_URL=postgresql://user:pass@host:5432/fintrack_analytics
ADMIN_PASSWORD_HASH=$2b$12$...
CORS_ORIGINS=https://yourdomain.com
```

### 3. Deploy Backend

#### Option A: Railway

```bash
# Push към GitHub
git add .
git commit -m "Add analytics backend"
git push

# В Railway:
1. New Project → Deploy from GitHub
2. Add PostgreSQL service
3. Set environment variables
4. Deploy
```

#### Option B: Render

```bash
# Push към GitHub
git add .
git commit -m "Add analytics backend"
git push

# В Render:
1. New Web Service → GitHub repo
2. Build Command: pip install -r backend/requirements.txt
3. Start Command: cd backend && gunicorn -k eventlet -w 1 app:app
4. Add PostgreSQL database
5. Set environment variables
6. Deploy
```

#### Option C: Local Development

```bash
cd backend
python app.py
# Backend: http://localhost:5000
```

### 4. Frontend Configuration

Редактирайте `index.html` (редове ~2033):

```javascript
window.ANALYTICS_API_URL = 'https://your-backend-url.com/api';
```

Редактирайте `admin/dashboard.html` и `admin/index.html`:

```javascript
const API_URL = 'https://your-backend-url.com/api';
const WS_URL = 'wss://your-backend-url.com';
```

### 5. Deploy Frontend

#### Option A: Netlify

```bash
# Push към GitHub
git add .
git commit -m "Configure analytics"
git push

# В Netlify:
1. New site from Git
2. Build settings: None (static site)
3. Publish directory: /
4. Deploy
```

#### Option B: Vercel

```bash
vercel deploy
```

#### Option C: GitHub Pages

```bash
# Push към GitHub
git add .
git commit -m "Configure analytics"
git push

# В GitHub repo settings:
Settings → Pages → Source: main branch
```

## 📊 Използване

### Tracking Events

Всички бутони с `data-track-id` се проследяват автоматично:

```html
<button data-track-id="my-button" data-track-label="My Button">
    Click Me
</button>
```

### Custom Events (от JavaScript)

```javascript
// Track custom event
window.FinTrackAnalytics.trackEvent('custom_event', {
    property1: 'value1',
    property2: 'value2'
});
```

### Admin Dashboard

1. Отворете `/admin/` (напр. `https://yourdomain.com/admin/`)
2. Въведете парола (която сте генерирали с `auth.py`)
3. Прегледайте статистиките в real-time!

## 🔒 Security Best Practices

1. **Променете default паролата** в `.env` файла
2. **Използвайте HTTPS** в production
3. **Ограничете CORS_ORIGINS** само до вашия домейн
4. **Активирайте rate limiting** в production
5. **Backup база данни** редовно

## 🧪 Testing

### Test Backend Locally

```bash
cd backend
python app.py

# Test API endpoints
curl http://localhost:5000/api/health
```

### Test Tracking

1. Отворете `index.html` в браузър
2. Отворете Developer Console (F12)
3. Проверете за "✅ FinTrack Analytics initialized"
4. Кликнете на бутон с `data-track-id`
5. Проверете Network tab за POST requests

### Test Admin Dashboard

1. Отворете `/admin/`
2. Login с парола
3. Проверете дали се зареждат статистики
4. Тествайте WebSocket connection (Real-time indicator)

## 📈 Maintenance

### Cleanup Old Data (GDPR)

Автоматично изтриване след 90 дни (задайте cron job):

```bash
psql -d fintrack_analytics -c "SELECT cleanup_old_analytics_data();"
```

### Monitor Active Users

```sql
SELECT COUNT(*) FROM active_sessions 
WHERE last_seen > NOW() - INTERVAL '5 minutes';
```

### View Top Clicked Buttons

```sql
SELECT button_id, button_text, COUNT(*) as clicks 
FROM click_events 
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY button_id, button_text 
ORDER BY clicks DESC 
LIMIT 10;
```

## 🐛 Troubleshooting

### Backend не стартира

```bash
# Проверете Python версия
python --version  # Трябва да е 3.11+

# Проверете dependencies
pip list

# Проверете DATABASE_URL
echo $DATABASE_URL
```

### Tracking не работи

1. Проверете Console за грешки
2. Проверете дали API_URL е правилен
3. Проверете CORS settings в backend
4. Проверете дали cookie consent е даден

### Admin Panel не се зарежда

1. Проверете authentication
2. Проверете Network tab за API errors
3. Проверете дали backend е running
4. Проверете CORS settings

### WebSocket не се свързва

1. Проверете дали backend поддържа WebSocket
2. Проверете WS_URL (ws:// или wss://)
3. Проверете firewall settings
4. Използвайте Socket.IO fallback (polling)

## 📦 Project Structure

```
FinTrack Landing page/
├── backend/                    # Python Flask Backend
│   ├── app.py                 # Main application
│   ├── models.py              # Database models
│   ├── auth.py                # Authentication
│   ├── config.py              # Configuration
│   ├── database.sql           # SQL schema
│   ├── requirements.txt       # Python deps
│   └── README.md              # Backend docs
├── admin/                     # Admin Dashboard
│   ├── index.html            # Login page
│   ├── dashboard.html        # Main dashboard
│   ├── admin.css             # Dashboard styles
│   └── admin.js              # Dashboard logic
├── assets/
│   └── js/
│       ├── tracking.js       # Universal tracking
│       └── cookie-consent.js # GDPR banner
├── index.html                # Main landing page (with tracking)
└── ANALYTICS_SETUP.md        # This file
```

## 🎯 Next Steps

1. ✅ Deploy backend към cloud platform
2. ✅ Deploy frontend към hosting
3. ✅ Configure API URLs
4. ✅ Test tracking functionality
5. ✅ Set up automated backups
6. ✅ Monitor analytics data
7. 🔄 Optimize based on data insights!

## 💡 Tips

- **Start simple**: Deploy locally first, then cloud
- **Test thoroughly**: Click all tracked buttons and verify data
- **Monitor regularly**: Check admin dashboard daily
- **Backup data**: Set up automated PostgreSQL backups
- **Scale wisely**: Add more backend instances if needed

## 📞 Support

За въпроси или проблеми:
1. Проверете logs в backend (`python app.py`)
2. Проверете browser console
3. Прегледайте този README файл
4. Check backend/README.md за детайли

---

**Всичко готово! Вашата analytics система е пълна и готова за употреба! 🚀**

