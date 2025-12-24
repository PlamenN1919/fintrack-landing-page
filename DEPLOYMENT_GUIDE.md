# 🚀 FinTrack Deployment Guide

Пълно ръководство за пускане на FinTrack в продукция.

## 📋 Преглед

- **Frontend:** Vercel (безплатно)
- **Backend:** Railway (безплатно с $5 credit/месец)
- **Database:** PostgreSQL на Railway (включено)

---

## 🎯 Стъпка 1: Подготовка на GitHub Repository

### 1.1 Commit и Push на промените

```bash
cd "/Users/nikolovp/Documents/FinTrack Landing page"
git add .
git commit -m "Add deployment configuration files"
git push origin main
```

Ако имаш проблеми с push:
```bash
git pull origin main --rebase
git push origin main
```

---

## 🚂 Стъпка 2: Deploy на Backend в Railway

### 2.1 Създаване на Railway акаунт

1. Отвори [railway.app](https://railway.app)
2. Кликни "Start a New Project"
3. Влез с GitHub акаунта си

### 2.2 Създаване на PostgreSQL база данни

1. Кликни "New Project"
2. Избери "Provision PostgreSQL"
3. Изчакай да се създаде базата данни
4. Railway автоматично ще генерира `DATABASE_URL`

### 2.3 Deploy на Backend приложението

1. В същия проект кликни "+ New"
2. Избери "GitHub Repo"
3. Избери твоя FinTrack repository
4. Railway ще открие автоматично `/backend` папката
5. Кликни "Deploy"

### 2.4 Конфигуриране на Environment Variables

В Railway проекта, отвори Backend service → Variables:

```env
FLASK_ENV=production
SECRET_KEY=<генерирай-случаен-ключ-тук>
CORS_ORIGINS=http://localhost:3000,https://<твоят-vercel-домейн>.vercel.app
ADMIN_PASSWORD_HASH=<генериран-hash>
REDIS_URL=memory://
DATA_RETENTION_DAYS=90
ACTIVE_SESSION_TIMEOUT=5
GDPR_ENABLED=true
IP_ANONYMIZATION=true
```

**Важно:** За SECRET_KEY използвай силен случаен низ (32+ символа)

### 2.5 Генериране на Admin парола

Локално изпълни:
```bash
cd backend
python auth.py твоята_парола_тук
```

Копирай генерирания hash и го добави като `ADMIN_PASSWORD_HASH` в Railway.

### 2.6 Инициализиране на базата данни

Railway автоматично ще изпълни `database.sql` при първото стартиране.

Ако трябва да го направиш ръчно:
1. Отвори Railway PostgreSQL → Connect
2. Копирай connection string
3. Локално изпълни:
```bash
psql <connection-string> -f backend/database.sql
```

### 2.7 Вземане на Backend URL

След успешен deploy:
1. Отвори Backend service в Railway
2. Кликни "Settings" → "Generate Domain"
3. Копирай URL-а (напр. `https://fintrack-backend.up.railway.app`)

---

## ⚡ Стъпка 3: Deploy на Frontend в Vercel

### 3.1 Създаване на Vercel акаунт

1. Отвори [vercel.com](https://vercel.com)
2. Кликни "Sign Up"
3. Влез с GitHub акаунта си

### 3.2 Import на проекта

1. Кликни "Add New..." → "Project"
2. Избери твоя FinTrack repository
3. Vercel ще открие автоматично HTML проекта

### 3.3 Конфигурация на проекта

**Root Directory:** Остави празно (използва root на repo)

**Build Settings:**
- Framework Preset: Other
- Build Command: (остави празно)
- Output Directory: (остави празно)
- Install Command: (остави празно)

### 3.4 Environment Variables

Добави следната променлива:

```env
ANALYTICS_API_URL=https://<твоят-railway-backend>.up.railway.app/api
```

### 3.5 Deploy

1. Кликни "Deploy"
2. Изчакай 1-2 минути
3. Vercel ще ти даде URL (напр. `https://fintrack.vercel.app`)

---

## 🔗 Стъпка 4: Свързване на Frontend с Backend

### 4.1 Обновяване на CORS в Railway

1. Отвори Railway → Backend service → Variables
2. Обнови `CORS_ORIGINS`:
```env
CORS_ORIGINS=https://<твоят-vercel-домейн>.vercel.app
```

### 4.2 Обновяване на tracking.js

Редактирай `assets/js/tracking.js`:

```javascript
const CONFIG = {
    apiUrl: 'https://<твоят-railway-backend>.up.railway.app/api',
    // ... останалото
};
```

### 4.3 Commit и Push промените

```bash
git add assets/js/tracking.js
git commit -m "Update backend API URL"
git push origin main
```

Vercel автоматично ще redeploy сайта.

---

## ✅ Стъпка 5: Тестване

### 5.1 Тестване на Frontend

1. Отвори `https://<твоят-vercel-домейн>.vercel.app`
2. Провери дали всички секции се зареждат правилно
3. Тествай навигацията
4. Провери responsive дизайна на мобилен

### 5.2 Тестване на Backend

1. Отвори `https://<твоят-railway-backend>.up.railway.app/health`
2. Трябва да видиш: `{"status": "healthy"}`

### 5.3 Тестване на Analytics

1. Отвори сайта и кликни на няколко бутона
2. Отвори Admin панела: `https://<твоят-vercel-домейн>.vercel.app/admin`
3. Влез с admin паролата
4. Провери дали се записват събития

### 5.4 Тестване на Cookie Consent

1. Отвори сайта в incognito режим
2. Трябва да видиш cookie consent banner
3. Приеми cookies
4. Провери дали tracking работи

---

## 🎨 Стъпка 6: Персонализиране на домейна (Опционално)

### 6.1 Добавяне на custom domain в Vercel

1. Купи домейн (напр. от Namecheap, GoDaddy)
2. В Vercel проекта → Settings → Domains
3. Добави твоя домейн
4. Следвай инструкциите за DNS настройки

### 6.2 Обновяване на CORS

Не забравяй да добавиш новия домейн в Railway CORS_ORIGINS!

---

## 🔧 Troubleshooting

### Backend не стартира

**Проблем:** Railway показва грешка при deploy

**Решение:**
1. Провери logs в Railway
2. Увери се, че `DATABASE_URL` е правилно зададен
3. Провери дали всички dependencies са в `requirements.txt`

### CORS грешки

**Проблем:** Frontend не може да се свърже с Backend

**Решение:**
1. Провери `CORS_ORIGINS` в Railway
2. Увери се, че включва точния Vercel домейн
3. Рестартирай Backend service в Railway

### Database грешки

**Проблем:** Backend не може да се свърже с базата данни

**Решение:**
1. Провери дали PostgreSQL service работи в Railway
2. Провери дали `DATABASE_URL` е правилно зададен
3. Изпълни `database.sql` ръчно

### Analytics не работи

**Проблем:** Събития не се записват

**Решение:**
1. Отвори Browser Console (F12)
2. Провери за JavaScript грешки
3. Провери дали `ANALYTICS_API_URL` е правилен в `tracking.js`
4. Провери дали cookie consent е приет

---

## 📊 Мониторинг

### Railway Dashboard

- Провери CPU/Memory usage
- Следи logs за грешки
- Настрой alerts за downtime

### Vercel Analytics

- Провери page views
- Следи performance metrics
- Анализирай geographic distribution

### FinTrack Admin Panel

- Следи активни потребители
- Анализирай click heatmaps
- Проследявай conversion funnel

---

## 🔒 Сигурност

### Best Practices

1. **Никога не commit-вай `.env` файлове**
2. **Използвай силни пароли** за admin панела
3. **Редовно обновявай** dependencies
4. **Следи Railway logs** за suspicious activity
5. **Активирай IP anonymization** (вече е активирано)

### GDPR Compliance

- ✅ Cookie consent banner
- ✅ IP anonymization
- ✅ Data retention policy (90 дни)
- ✅ Opt-out опция

---

## 🚀 Следващи стъпки

1. **SEO Оптимизация**
   - Добави Open Graph meta tags
   - Създай sitemap.xml
   - Submit към Google Search Console

2. **Performance**
   - Оптимизирай изображения
   - Минифицирай CSS/JS
   - Добави CDN за assets

3. **Marketing**
   - Интегрирай Google Analytics
   - Добави Facebook Pixel
   - Настрой email marketing

4. **A/B Testing**
   - Тествай различни CTA buttons
   - Експериментирай с pricing
   - Оптимизирай conversion rate

---

## 📞 Поддръжка

Ако имаш проблеми:

1. Провери този guide отново
2. Прегледай Railway/Vercel logs
3. Провери Browser Console за грешки
4. Потърси в Railway/Vercel документацията

---

**Готово! 🎉 Твоят FinTrack сайт е онлайн!**

Сподели го с приятели и започни да събираш потребители! 🚀

