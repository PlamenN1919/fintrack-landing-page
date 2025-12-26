# 🚀 FinTrack Production Deployment Guide
**Домейн: fintrackwallet.com**

## 📋 Преглед на архитектурата

```
fintrackwallet.com (Frontend - Vercel)
    ↓
Backend API (Railway)
    ↓
PostgreSQL Database (Railway)
```

---

## 🎯 Deployment Checklist

### ✅ Преди deployment
- [x] GitHub repository готов
- [x] Performance оптимизации завършени
- [x] Backend код готов
- [x] Домейн закупен от jump.bg

### 🚂 Backend Deployment (Railway)

#### Стъпка 1: Създаване на Railway проект
1. Отвори [railway.app](https://railway.app)
2. Sign in с GitHub
3. Кликни "New Project"
4. Избери "Deploy from GitHub repo"
5. Избери `PlamenN1919/fintrack-landing-page`

#### Стъпка 2: Добавяне на PostgreSQL
1. В същия проект кликни "+ New"
2. Избери "Database" → "Add PostgreSQL"
3. Railway автоматично ще създаде `DATABASE_URL`

#### Стъпка 3: Конфигуриране на Backend Service
1. Кликни на Backend service
2. Settings → Root Directory → Задай: `backend`
3. Settings → Generate Domain (вземи URL-а за по-късно)

#### Стъпка 4: Environment Variables
Отвори Backend service → Variables и добави:

```env
# Flask Configuration
FLASK_ENV=production
SECRET_KEY=<генерирай-силен-случаен-ключ-32-символа>

# CORS - ЩЕ ОБНОВИМ СЛЕД VERCEL DEPLOY
CORS_ORIGINS=https://fintrackwallet.com,https://www.fintrackwallet.com

# Admin Authentication
ADMIN_PASSWORD_HASH=<генериран-hash-от-auth.py>

# Redis (за rate limiting)
REDIS_URL=memory://

# Analytics Settings
DATA_RETENTION_DAYS=90
ACTIVE_SESSION_TIMEOUT=5

# GDPR Compliance
GDPR_ENABLED=true
IP_ANONYMIZATION=true
```

#### Стъпка 5: Генериране на Admin парола
Локално изпълни:
```bash
cd backend
python3 auth.py твоята_сигурна_парола
```
Копирай hash-а и го добави като `ADMIN_PASSWORD_HASH` в Railway.

#### Стъпка 6: Deploy Backend
1. Railway автоматично ще deploy-не при push
2. Провери Logs за грешки
3. Тествай: `https://<твоят-railway-url>/health`
4. Трябва да видиш: `{"status": "healthy"}`

**Запиши Backend URL:** `https://<твоят-railway-url>`

---

### ⚡ Frontend Deployment (Vercel)

#### Стъпка 1: Създаване на Vercel проект
1. Отвори [vercel.com](https://vercel.com)
2. Sign in с GitHub
3. Кликни "Add New..." → "Project"
4. Избери `PlamenN1919/fintrack-landing-page`

#### Стъпка 2: Конфигурация на проекта
**Framework Preset:** Other (Static HTML)
**Root Directory:** `.` (root)
**Build Command:** (остави празно)
**Output Directory:** `.` (root)
**Install Command:** (остави празно)

#### Стъпка 3: Environment Variables
Добави:
```env
ANALYTICS_API_URL=https://<твоят-railway-backend-url>/api
```

#### Стъпка 4: Deploy
1. Кликни "Deploy"
2. Изчакай 1-2 минути
3. Vercel ще даде temporary URL (напр. `fintrack-landing-page.vercel.app`)

---

### 🌐 Свързване на домейн fintrackwallet.com

#### Стъпка 1: Добавяне на домейн в Vercel
1. Отвори Vercel проекта
2. Settings → Domains
3. Добави: `fintrackwallet.com`
4. Добави: `www.fintrackwallet.com`

#### Стъпка 2: Вземи DNS настройките от Vercel
Vercel ще покаже нещо подобно:

**За fintrackwallet.com (root domain):**
```
Type: A
Name: @
Value: 76.76.21.21
```

**За www.fintrackwallet.com:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

#### Стъпка 3: Конфигуриране на DNS в jump.bg
1. Влез в [jump.bg](https://www.jump.bg)
2. Отиди на "Моите домейни"
3. Избери `fintrackwallet.com`
4. Кликни "DNS управление" или "DNS Zone"

**Добави следните записи:**

**A Record (за root domain):**
```
Тип: A
Име/Host: @ (или остави празно)
Стойност/Value: 76.76.21.21
TTL: 3600 (или Auto)
```

**CNAME Record (за www):**
```
Тип: CNAME
Име/Host: www
Стойност/Value: cname.vercel-dns.com
TTL: 3600 (или Auto)
```

**Важно:** Изтрий всички стари A или CNAME записи за @ и www, ако има такива!

#### Стъпка 4: Изчакай DNS propagation
- DNS промените отнемат 5-60 минути
- Провери статуса в Vercel (Settings → Domains)
- Когато е готово, ще видиш зелен чек ✅

---

### 🔗 Финализиране на връзките

#### Стъпка 1: Обнови CORS в Railway Backend
1. Отвори Railway → Backend service → Variables
2. Обнови `CORS_ORIGINS`:
```env
CORS_ORIGINS=https://fintrackwallet.com,https://www.fintrackwallet.com
```
3. Backend ще се рестартира автоматично

#### Стъпка 2: Провери tracking.js
Файлът `assets/js/tracking.js` вече е конфигуриран да използва:
```javascript
apiUrl: window.ANALYTICS_API_URL || 'http://localhost:5000/api'
```

Това означава, че ще вземе URL-а от Vercel environment variable, който вече сме задали.

---

## ✅ Тестване на Production системата

### 1. Тествай Backend
```bash
curl https://<твоят-railway-url>/health
# Очакван резултат: {"status": "healthy"}
```

### 2. Тествай Frontend
1. Отвори `https://fintrackwallet.com`
2. Провери дали се зарежда правилно
3. Отвори Browser Console (F12)
4. Провери за грешки

### 3. Тествай Analytics
1. Кликни на няколко бутона на сайта
2. Отвори `https://fintrackwallet.com/admin`
3. Влез с admin паролата
4. Провери дали се записват събития

### 4. Тествай Cookie Consent
1. Отвори сайта в incognito
2. Трябва да видиш cookie banner
3. Приеми cookies
4. Провери дали tracking работи

### 5. Тествай Mobile
1. Отвори на телефон
2. Провери responsive дизайна
3. Тествай всички секции

---

## 🔒 Сигурност & Best Practices

### ✅ Вече имплементирано
- [x] HTTPS (автоматично от Vercel)
- [x] CORS protection
- [x] Rate limiting
- [x] IP anonymization
- [x] GDPR compliance
- [x] Cookie consent
- [x] Secure admin authentication

### 📊 Препоръки след deployment
1. **Настрой Google Search Console**
   - Submit sitemap
   - Провери indexing

2. **Добави Google Analytics** (опционално)
   - За допълнителна аналитика
   - Complementary на FinTrack Analytics

3. **Настрой uptime monitoring**
   - UptimeRobot (безплатно)
   - Pingdom
   - StatusCake

4. **Backup стратегия**
   - Railway прави автоматични backups на DB
   - Периодично export на данни

---

## 🐛 Troubleshooting

### Проблем: "ERR_NAME_NOT_RESOLVED"
**Причина:** DNS не е propagate-нал още
**Решение:** Изчакай 30-60 минути, провери DNS с `nslookup fintrackwallet.com`

### Проблем: CORS грешки в Console
**Причина:** Backend CORS не включва production домейна
**Решение:** Провери `CORS_ORIGINS` в Railway, рестартирай backend

### Проблем: Analytics не работи
**Причина:** API URL не е правилно конфигуриран
**Решение:** 
1. Провери `ANALYTICS_API_URL` в Vercel environment variables
2. Провери Browser Console за грешки
3. Тествай backend health endpoint

### Проблем: SSL Certificate грешка
**Причина:** Vercel все още генерира SSL сертификат
**Решение:** Изчакай 5-10 минути след DNS propagation

### Проблем: Admin панел не работи
**Причина:** Грешна парола или backend не работи
**Решение:**
1. Провери backend logs в Railway
2. Провери дали `ADMIN_PASSWORD_HASH` е правилно зададен
3. Regenerate hash с `auth.py`

---

## 📞 Полезни линкове

- **Frontend:** https://fintrackwallet.com
- **Admin Panel:** https://fintrackwallet.com/admin
- **Backend Health:** https://<railway-url>/health
- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **jump.bg DNS:** https://www.jump.bg

---

## 🎉 След успешен deployment

1. ✅ Тествай всички функции
2. ✅ Провери mobile responsive
3. ✅ Тествай analytics tracking
4. ✅ Провери admin панел
5. ✅ Мониторинг за първите 24 часа
6. ✅ Share с приятели и събирай feedback!

---

**Готово! fintrackwallet.com е онлайн! 🚀**

