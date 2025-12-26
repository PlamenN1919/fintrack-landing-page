# 🚀 FinTrack Deployment - Стъпка по стъпка за fintrackwallet.com

## 📌 Важно: Следвай точно тези стъпки в този ред!

---

## ЧАСТ 1️⃣: Backend Deployment (Railway) - 15 минути

### Стъпка 1.1: Отвори Railway
1. Отвори в браузър: https://railway.app
2. Кликни **"Login"** → Избери **"Login with GitHub"**
3. Ако е необходимо, authorize Railway да достъпва GitHub

### Стъпка 1.2: Създай нов проект
1. Кликни **"New Project"** (голям бутон в центъра)
2. Избери **"Deploy from GitHub repo"**
3. Намери и избери: **`PlamenN1919/fintrack-landing-page`**
4. Railway ще започне да scan-ва repo-то

### Стъпка 1.3: Конфигурирай Backend service
1. Railway ще открие автоматично проекта
2. Кликни на service-а (ще се казва нещо като "fintrack-landing-page")
3. Отиди на **Settings** (от менюто вляво)
4. Намери **"Root Directory"**
5. Въведи: `backend`
6. Кликни **"Save"**

### Стъпка 1.4: Добави PostgreSQL база данни
1. В същия проект (горе вляво) кликни **"+ New"**
2. Избери **"Database"**
3. Избери **"Add PostgreSQL"**
4. Railway автоматично ще създаде база данни
5. Изчакай 30 секунди да се инициализира

### Стъпка 1.5: Генерирай Admin парола (ЛОКАЛНО)
**Отвори Terminal на компютъра си и изпълни:**

```bash
cd "/Users/nikolovp/Documents/FinTrack Landing page/backend"
python3 auth.py твоята_сигурна_парола_тук
```

**Пример:**
```bash
python3 auth.py MySecurePass123!
```

**Копирай hash-а** който се показва (започва с `$2b$12$...`)

### Стъпка 1.6: Добави Environment Variables
1. В Railway, кликни на Backend service (не на PostgreSQL)
2. Отиди на **"Variables"** tab
3. Кликни **"+ New Variable"**
4. Добави **ВСИЧКИ** тези променливи една по една:

```
FLASK_ENV=production
```

```
SECRET_KEY=FinTrack2024SecureProductionKey!@#
```

```
CORS_ORIGINS=https://fintrackwallet.com,https://www.fintrackwallet.com
```

```
ADMIN_PASSWORD_HASH=<тук-постави-hash-а-от-стъпка-1.5>
```

```
REDIS_URL=memory://
```

```
DATA_RETENTION_DAYS=90
```

```
ACTIVE_SESSION_TIMEOUT=5
```

```
GDPR_ENABLED=true
```

```
IP_ANONYMIZATION=true
```

**Важно:** Railway автоматично добавя `DATABASE_URL` - НЕ го променяй!

### Стъпка 1.7: Deploy Backend
1. Railway автоматично ще deploy-не след добавяне на variables
2. Отиди на **"Deployments"** tab
3. Изчакай deploy-а да завърши (2-3 минути)
4. Провери за грешки в **"Logs"** tab

### Стъпка 1.8: Вземи Backend URL
1. В Backend service, отиди на **"Settings"**
2. Намери секцията **"Domains"**
3. Кликни **"Generate Domain"**
4. Railway ще генерира URL (напр. `fintrack-backend-production.up.railway.app`)
5. **КОПИРАЙ този URL** - ще ти трябва за Vercel!

### Стъпка 1.9: Тествай Backend
Отвори в браузър:
```
https://<твоят-railway-url>/health
```

Трябва да видиш:
```json
{"status": "healthy"}
```

✅ **Backend е готов!**

---

## ЧАСТ 2️⃣: Frontend Deployment (Vercel) - 10 минути

### Стъпка 2.1: Отвори Vercel
1. Отвори в браузър: https://vercel.com
2. Кликни **"Sign Up"** или **"Login"**
3. Избери **"Continue with GitHub"**
4. Authorize Vercel

### Стъпка 2.2: Import проекта
1. Кликни **"Add New..."** (горе вдясно)
2. Избери **"Project"**
3. Намери **`PlamenN1919/fintrack-landing-page`**
4. Кликни **"Import"**

### Стъпка 2.3: Конфигурирай проекта
На екрана "Configure Project":

**Framework Preset:** Избери **"Other"**

**Root Directory:** Остави празно (или `.`)

**Build Settings:**
- Build Command: (остави празно)
- Output Directory: (остави празно)
- Install Command: (остави празно)

### Стъпка 2.4: Добави Environment Variable
1. Разгъни **"Environment Variables"** секцията
2. В полето **"Key"** напиши:
```
ANALYTICS_API_URL
```

3. В полето **"Value"** напиши (използвай Railway URL-а от стъпка 1.8):
```
https://<твоят-railway-url>/api
```

**Пример:**
```
https://fintrack-backend-production.up.railway.app/api
```

4. Кликни **"Add"**

### Стъпка 2.5: Deploy
1. Кликни **"Deploy"** (голям син бутон)
2. Изчакай 1-2 минути
3. Vercel ще покаже "Congratulations!" когато е готово
4. Ще видиш temporary URL (напр. `fintrack-landing-page.vercel.app`)

### Стъпка 2.6: Тествай temporary URL
1. Кликни на URL-а
2. Провери дали сайтът се зарежда правилно
3. Отвори Browser Console (F12)
4. Провери за грешки

✅ **Frontend е deploy-нат на temporary URL!**

---

## ЧАСТ 3️⃣: Свързване на домейн fintrackwallet.com - 20 минути

### Стъпка 3.1: Добави домейн в Vercel
1. В Vercel проекта, отиди на **"Settings"** (горе)
2. От менюто вляво избери **"Domains"**
3. В полето "Enter domain" напиши:
```
fintrackwallet.com
```
4. Кликни **"Add"**

### Стъпка 3.2: Добави www субдомейн
1. В същата страница, добави втори домейн:
```
www.fintrackwallet.com
```
2. Кликни **"Add"**

### Стъпка 3.3: Вземи DNS настройките от Vercel
Vercel ще покаже нещо подобно:

**За fintrackwallet.com:**
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

**КОПИРАЙ тези стойности!** (може да са малко различни)

---

## ЧАСТ 4️⃣: Конфигуриране на DNS в jump.bg - 15 минути

### Стъпка 4.1: Влез в jump.bg
1. Отвори: https://www.jump.bg
2. Кликни **"Вход"** (горе вдясно)
3. Въведи username и парола
4. Влез в акаунта си

### Стъпка 4.2: Отвори DNS управление
1. Отиди на **"Моите домейни"** или **"My Domains"**
2. Намери **`fintrackwallet.com`**
3. Кликни на домейна
4. Намери и кликни **"DNS управление"** или **"DNS Zone"** или **"Name Servers"**

### Стъпка 4.3: Изтрий стари записи (ако има)
**ВАЖНО:** Първо изтрий всички стари A и CNAME записи за:
- `@` (root domain)
- `www`

### Стъпка 4.4: Добави A Record за root domain
Кликни **"Добави запис"** или **"Add Record"**

```
Тип (Type): A
Име (Name/Host): @ (или остави празно)
Стойност (Value/Points to): 76.76.21.21
TTL: 3600 (или Auto/Default)
```

Кликни **"Запази"** или **"Save"**

### Стъпка 4.5: Добави CNAME Record за www
Кликни **"Добави запис"** или **"Add Record"**

```
Тип (Type): CNAME
Име (Name/Host): www
Стойност (Value/Points to): cname.vercel-dns.com
TTL: 3600 (или Auto/Default)
```

Кликни **"Запази"** или **"Save"**

### Стъпка 4.6: Провери DNS записите
Увери се, че виждаш:
- ✅ A запис: `@` → `76.76.21.21`
- ✅ CNAME запис: `www` → `cname.vercel-dns.com`

✅ **DNS е конфигуриран!**

---

## ЧАСТ 5️⃣: Изчакай DNS Propagation - 5-60 минути

### Стъпка 5.1: Провери статуса в Vercel
1. Върни се в Vercel → Settings → Domains
2. Refresh страницата на всеки 5 минути
3. Когато DNS propagate-не, ще видиш:
   - ✅ **Valid Configuration** (зелен чек)
   - SSL Certificate ще се генерира автоматично

### Стъпка 5.2: Тествай домейна
Отвори в браузър:
```
https://fintrackwallet.com
```

Ако работи - **БРАВО!** 🎉

Ако не работи още:
- Изчакай още 10-20 минути
- Провери DNS с: https://dnschecker.org (въведи `fintrackwallet.com`)

---

## ЧАСТ 6️⃣: Обнови index.html с production backend URL

### Стъпка 6.1: Обнови index.html локално
Отвори `/Users/nikolovp/Documents/FinTrack Landing page/index.html`

Намери (около ред 2101):
```javascript
window.ANALYTICS_API_URL = 'https://fintrack-landing-page-production.up.railway.app/api';
```

Замени с твоя Railway URL:
```javascript
window.ANALYTICS_API_URL = 'https://<твоят-railway-url>/api';
```

### Стъпка 6.2: Commit и Push
```bash
cd "/Users/nikolovp/Documents/FinTrack Landing page"
git add index.html
git commit -m "Update backend API URL to production Railway URL"
git push origin main
```

Vercel автоматично ще redeploy-не сайта (1-2 минути).

---

## ЧАСТ 7️⃣: Финално тестване - 10 минути

### ✅ Тест 1: Frontend зареждане
1. Отвори: `https://fintrackwallet.com`
2. Провери дали всички секции се зареждат
3. Тествай на mobile (отвори DevTools → Toggle device toolbar)

### ✅ Тест 2: Backend connectivity
1. Отвори Browser Console (F12)
2. Refresh страницата
3. Провери за грешки (не трябва да има CORS errors)

### ✅ Тест 3: Cookie Consent
1. Отвори сайта в Incognito/Private режим
2. Трябва да видиш cookie consent banner
3. Кликни "Приемам"
4. Banner трябва да изчезне

### ✅ Тест 4: Analytics Tracking
1. Кликни на няколко бутона (CTA, Download, и т.н.)
2. Отвори: `https://fintrackwallet.com/admin`
3. Влез с admin паролата (от стъпка 1.5)
4. Провери дали виждаш:
   - Page visits
   - Button clicks
   - Active sessions

### ✅ Тест 5: Mobile responsive
1. Отвори на телефон
2. Провери всички секции
3. Тествай навигацията

---

## 🎉 ГОТОВО!

### Твоят сайт е онлайн на:
- 🌐 **https://fintrackwallet.com**
- 🌐 **https://www.fintrackwallet.com**

### Admin панел:
- 🔐 **https://fintrackwallet.com/admin**

### Backend API:
- ⚙️ **https://<твоят-railway-url>/api**

---

## 📊 Следващи стъпки (опционално)

### 1. Google Search Console
1. Отвори: https://search.google.com/search-console
2. Добави `fintrackwallet.com`
3. Verify ownership (Vercel автоматично добавя verification)
4. Submit sitemap (ако имаш)

### 2. Uptime Monitoring
1. Създай безплатен акаунт в: https://uptimerobot.com
2. Добави monitor за `https://fintrackwallet.com`
3. Настрой email alerts

### 3. Analytics
- Вече имаш FinTrack Analytics ✅
- Опционално: Добави Google Analytics за допълнителна аналитика

---

## 🐛 Troubleshooting

### Проблем: "This site can't be reached"
**Решение:** DNS все още не е propagate-нал. Изчакай 30-60 минути.

### Проблем: CORS грешки в Console
**Решение:** 
1. Провери `CORS_ORIGINS` в Railway Variables
2. Трябва да съдържа: `https://fintrackwallet.com,https://www.fintrackwallet.com`
3. Рестартирай Backend service в Railway

### Проблем: Analytics не работи
**Решение:**
1. Провери `window.ANALYTICS_API_URL` в index.html
2. Провери Backend health: `https://<railway-url>/health`
3. Провери Browser Console за грешки

### Проблем: Admin панел не работи
**Решение:**
1. Провери дали backend-ът работи
2. Провери дали `ADMIN_PASSWORD_HASH` е правилно зададен в Railway
3. Regenerate hash с `python3 auth.py нова_парола`

---

## 📞 Полезни линкове

- **Railway Dashboard:** https://railway.app/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **jump.bg DNS:** https://www.jump.bg
- **DNS Checker:** https://dnschecker.org
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html

---

**Успех! 🚀 Ако имаш въпроси, провери PRODUCTION_DEPLOYMENT.md за детайли.**

