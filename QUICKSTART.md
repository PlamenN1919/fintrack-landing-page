# ⚡ Quick Start - FinTrack Analytics

Бърз старт за локално тестване на analytics системата.

## 🎯 Какво е имплементирано?

✅ Tracking на посещения и кликвания  
✅ Admin dashboard с real-time updates  
✅ GDPR cookie consent banner  
✅ PostgreSQL database  
✅ WebSocket за live данни  

## 🚀 5-минутен старт

### Стъпка 1: Database

```bash
# Създайте PostgreSQL база данни
createdb fintrack_analytics

# Заредете schema
psql -d fintrack_analytics -f backend/database.sql
```

### Стъпка 2: Backend

```bash
cd backend

# Инсталирайте dependencies
pip install -r requirements.txt

# Създайте .env файл
cp .env.example .env

# Генерирайте admin парола
python auth.py admin123
# Копирайте hash-а в .env файла като ADMIN_PASSWORD_HASH

# Стартирайте backend
python app.py
```

Backend running на: `http://localhost:5000`

### Стъпка 3: Frontend

```bash
# Отворете index.html в браузър
open index.html

# Или използвайте local server:
python -m http.server 3000
# Отворете http://localhost:3000
```

### Стъпка 4: Test Tracking

1. Отворете браузър на `http://localhost:3000`
2. Отворете Console (F12)
3. Трябва да видите: `✅ FinTrack Analytics initialized`
4. Кликнете на "Изтегли" бутон
5. Проверете Network tab - трябва да има POST към `/api/track/click`

### Стъпка 5: Admin Dashboard

1. Отворете `http://localhost:3000/admin/`
2. Въведете парола: `admin123` (или каквато сте избрали)
3. Вижте статистиките!

## 🎨 Tracked Buttons

Следните бутони вече имат tracking:

- **iOS Download** - `data-track-id="download-ios"`
- **Android Download** - `data-track-id="download-android"`
- **Pain Calculator** - `data-track-id="pain-calculator"`
- **Stop Losses CTA** - `data-track-id="stop-losses-cta"`

## 📊 Проверка че работи

### 1. Console
```javascript
// Трябва да видите:
✅ FinTrack Analytics initialized { sessionId: "...", consentGiven: false }
```

### 2. Network Tab
```
POST http://localhost:5000/api/track/visit
POST http://localhost:5000/api/track/click
```

### 3. Admin Dashboard
- Посещения трябва да се увеличат
- Кликвания трябва да се показват в таблицата
- Real-time indicator трябва да е зелен

## 🐛 Troubleshooting

### Backend не стартира
```bash
# Проверете Python версия (трябва 3.11+)
python --version

# Инсталирайте dependencies отново
pip install -r requirements.txt
```

### Tracking не работи
```bash
# Проверете дали backend е running
curl http://localhost:5000/api/health

# Трябва да получите: {"status":"healthy"}
```

### Admin login не работи
```bash
# Регенерирайте парола
cd backend
python auth.py admin123

# Копирайте новия hash в .env
nano .env
```

### Database грешки
```bash
# Рестартирайте PostgreSQL
brew services restart postgresql  # macOS
sudo service postgresql restart   # Linux

# Проверете connection
psql -d fintrack_analytics -c "SELECT 1"
```

## 📁 Структура

```
backend/
  ├── app.py           ← Main Flask app
  ├── database.sql     ← SQL schema
  └── .env             ← Configuration

admin/
  ├── index.html       ← Login page
  └── dashboard.html   ← Admin dashboard

assets/js/
  ├── tracking.js      ← Tracking script
  └── cookie-consent.js ← GDPR banner

index.html           ← Landing page (tracking added)
```

## 🎯 Next Steps

1. ✅ Test локално
2. 📖 Прочети `ANALYTICS_SETUP.md` за deployment
3. 🚀 Deploy backend към Railway/Render
4. 🌐 Deploy frontend към Netlify/Vercel
5. 📊 Мониторирай данни!

## 📚 Full Documentation

- **Setup Guide**: `ANALYTICS_SETUP.md`
- **Complete Docs**: `README_ANALYTICS.md`
- **Backend Docs**: `backend/README.md`

## 💡 Quick Tips

- Cookie consent banner се показва само веднъж
- Real-time updates работят чрез WebSocket
- Данни се трият автоматично след 90 дни (GDPR)
- Admin password е хеширан с bcrypt

---

**Готово за тестване! 🚀**

За помощ: прочетете документацията или проверете console/logs.

