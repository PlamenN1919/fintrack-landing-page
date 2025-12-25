# 🔧 TROUBLESHOOTING GUIDE

## Текущи проблеми:

1. ❌ Backend - database disconnected
2. ❌ Frontend - 404 error

---

## 🚂 RAILWAY BACKEND - Стъпка по стъпка fix

### Проблем: Database disconnected

### Решение:

#### Стъпка 1: Провери дали има PostgreSQL service

1. Отвори https://railway.app
2. Отвори твоя проект
3. **Виждаш ли ДВА service-а?**
   - ☐ Postgres (или PostgreSQL)
   - ☐ fintrack-landing-page (Backend)

**Ако виждаш само Backend:**
- Кликни "+ New" → "Database" → "Add PostgreSQL"
- Изчакай 30 секунди
- Продължи към Стъпка 2

#### Стъпка 2: Свържи PostgreSQL с Backend

**Метод А: Variable Reference (Препоръчвам)**

1. Кликни на **Backend service** (fintrack-landing-page)
2. Таб **"Variables"**
3. **Провери дали има `DATABASE_URL`:**
   - Ако ДА - **изтрий я** (кликни X)
   - Ако НЕ - продължи
4. Кликни **"+ New Variable"**
5. **Variable Name:** `DATABASE_URL`
6. **Value:** Кликни dropdown и избери **"Add a Reference"**
7. **Service:** Избери **Postgres**
8. **Variable:** Избери **`DATABASE_URL`** (или `DATABASE_PUBLIC_URL` ако няма друго)
9. **Add**

**Метод Б: Ръчно копиране (ако горното не работи)**

1. Кликни на **Postgres service**
2. Таб **"Variables"** или **"Connect"**
3. Намери **`DATABASE_URL`** или **`DATABASE_PUBLIC_URL`**
4. **Копирай цялата стойност**
5. Върни се на **Backend service**
6. Таб **"Variables"**
7. Изтрий старата `DATABASE_URL` (ако има)
8. Кликни **"+ New Variable"**
9. **Name:** `DATABASE_URL`
10. **Value:** Постави копираната стойност
11. **ВАЖНО:** Ако започва с `postgres://` замени с `postgresql://`
12. **Add**

#### Стъпка 3: Провери други променливи

В Backend service → Variables, трябва да имаш:

```
DATABASE_URL = (reference към Postgres или URL)
FLASK_ENV = production
SECRET_KEY = (твоя secret key)
CORS_ORIGINS = https://fintrack-landing-page.vercel.app
ADMIN_PASSWORD_HASH = $2b$12$...
REDIS_URL = memory://
DATA_RETENTION_DAYS = 90
ACTIVE_SESSION_TIMEOUT = 5
GDPR_ENABLED = true
IP_ANONYMIZATION = true
```

#### Стъпка 4: Изчакай Redeploy

Railway автоматично ще redeploy след промяна в Variables.

**Изчакай 2-3 минути.**

#### Стъпка 5: Тествай

Отвори в браузър:
```
https://fintrack-landing-page-production.up.railway.app/health
```

**Очакван резултат:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-12-25T..."
}
```

**Ако все още е "disconnected":**

1. Отвори Backend service → **Deployments**
2. Кликни на последния deployment
3. **View Logs**
4. Търси за грешки с "database" или "connection"
5. Копирай последните 20 реда и потърси помощ

---

## ⚡ VERCEL FRONTEND - Стъпка по стъпка fix

### Проблем: 404 NOT_FOUND

### Решение:

#### Стъпка 1: Провери Project Settings

1. Отвори https://vercel.com
2. Кликни на **fintrack-landing-page** проект
3. Кликни **"Settings"** (горе в менюто)
4. Кликни **"General"** (ляво меню)

#### Стъпка 2: Провери Root Directory

Скролни до **"Root Directory"**

**Трябва да е ПРАЗНО!**

- Ако пише `backend` → **ИЗТРИЙ ГО!**
- Ако пише нещо друго → **ИЗТРИЙ ГО!**
- Остави полето **ПРАЗНО**

**Save**

#### Стъпка 3: Провери Framework Preset

В същата страница (Settings → General):

**Framework Preset:** Трябва да е **"Other"** или **"None"**

Ако е нещо друго:
- Кликни **"Edit"**
- Избери **"Other"**
- **Save**

#### Стъпка 4: Провери Build Settings

Скролни до **"Build & Development Settings"**

Всички полета трябва да са **ПРАЗНИ**:
- Build Command: (празно)
- Output Directory: (празно)
- Install Command: (празно)
- Development Command: (празно)

#### Стъпка 5: Redeploy

1. Отвори таб **"Deployments"**
2. Кликни на последния deployment
3. Кликни **трите точки (⋯)**
4. Избери **"Redeploy"**
5. Кликни **"Redeploy"** за потвърждение

**Изчакай 1-2 минути.**

#### Стъпка 6: Тествай

Отвори в браузър:
```
https://fintrack-landing-page.vercel.app
```

**Очакван резултат:**
- Виждаш FinTrack landing page
- Дизайнът се зарежда правилно
- Няма 404 грешка

**Ако все още е 404:**

1. Отвори Vercel → Deployments
2. Кликни на последния deployment
3. **View Function Logs** или **Build Logs**
4. Търси за грешки
5. Копирай грешките и потърси помощ

---

## 🔗 След като и двете работят

### Свържи Frontend с Backend:

#### 1. Обнови CORS в Railway

1. Railway → Backend service → Variables
2. Намери `CORS_ORIGINS`
3. Обнови стойността:
```
https://fintrack-landing-page.vercel.app
```
4. Save (Railway ще redeploy)

#### 2. Тествай пълната интеграция

1. Отвори Frontend: `https://fintrack-landing-page.vercel.app`
2. Натисни **F12** → **Console** tab
3. Приеми **Cookie Consent** banner-а
4. Кликни на няколко бутона
5. **НЕ трябва** да има CORS грешки в Console

#### 3. Тествай Admin Panel

1. Отвори: `https://fintrack-landing-page.vercel.app/admin`
2. Влез с парола: `admin123`
3. Трябва да видиш dashboard
4. Провери дали се показват събития

---

## 📞 Ако нищо не работи

### Последна опция: Започни отначало

#### За Railway:

1. Изтрий текущия проект
2. Създай нов проект
3. Добави PostgreSQL
4. Добави Backend от GitHub
5. **Root Directory:** `backend`
6. Добави всички променливи
7. Свържи DATABASE_URL

#### За Vercel:

1. Изтрий текущия проект
2. Import отново от GitHub
3. **Root Directory:** ПРАЗНО
4. **Framework:** Other
5. Deploy

---

## ✅ Контролен списък

### Railway Backend:
- [ ] PostgreSQL service съществува
- [ ] DATABASE_URL е добавен (reference или URL)
- [ ] DATABASE_URL започва с `postgresql://`
- [ ] Всички environment variables са добавени
- [ ] Deployment е Success
- [ ] `/health` показва `"database": "connected"`

### Vercel Frontend:
- [ ] Root Directory е ПРАЗНО
- [ ] Framework Preset е "Other"
- [ ] Build settings са празни
- [ ] Deployment е Ready
- [ ] Сайтът се отваря (не е 404)
- [ ] index.html се зарежда

### Интеграция:
- [ ] CORS_ORIGINS включва Vercel URL
- [ ] Няма CORS грешки в Console
- [ ] Cookie consent работи
- [ ] Tracking работи
- [ ] Admin panel работи

---

**Успех! 🚀**

