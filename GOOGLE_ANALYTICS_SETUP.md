# 📊 Google Analytics 4 Setup - Бърза инструкция

## Стъпка 1: Създай GA4 Property

1. Отиди на https://analytics.google.com/
2. Влез с Google акаунт
3. Кликни "Admin" (долу вляво)
4. Кликни "Create Property"
5. Попълни:
   - Property name: **FinTrack Landing Page**
   - Time zone: **Bulgaria (GMT+2)**
   - Currency: **Bulgarian Lev (BGN)**
6. Кликни "Next"

## Стъпка 2: Създай Data Stream

1. Избери platform: **Web**
2. Попълни:
   - Website URL: **https://fintrackwallet.com**
   - Stream name: **FinTrack Website**
3. Кликни "Create stream"
4. **Копирай Measurement ID** (вид: G-XXXXXXXXXX)

## Стъпка 3: Добави кода в index.html

Добави следния код в `index.html` **ПРЕДИ** затварящия `</head>` tag (около ред 150):

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**⚠️ ВАЖНО:** Замени `G-XXXXXXXXXX` с твоя реален Measurement ID!

## Стъпка 4: Deploy промените

```bash
# Commit и push промените
git add index.html
git commit -m "Add Google Analytics 4"
git push

# Vercel автоматично ще deploy-не промените
```

## Стъпка 5: Тествай

1. Отвори сайта: https://fintrackwallet.com
2. В GA4 отиди на **Reports** → **Realtime**
3. Трябва да видиш себе си като активен потребител (може да отнеме 1-2 минути)

## Какво ще следиш:

### Основни метрики:
- **Users** - уникални посетители
- **Sessions** - сесии
- **Pageviews** - прегледи на страници
- **Bounce Rate** - процент на отпадане
- **Average Session Duration** - средна продължителност

### Events (автоматични):
- `page_view` - преглед на страница
- `first_visit` - първо посещение
- `session_start` - начало на сесия
- `scroll` - скролване (90%)
- `click` - кликове на линкове

### Custom Events (от твоя tracking.js):
- `download_ios` - клик на iOS download button
- `download_android` - клик на Android download button
- `cta_click` - клик на CTA buttons
- И други...

## Полезни настройки:

### Enhanced Measurement (препоръчително)
В Data Stream настройките, активирай:
- ✅ Page views
- ✅ Scrolls
- ✅ Outbound clicks
- ✅ Site search
- ✅ Video engagement
- ✅ File downloads

### Conversion Events
Маркирай като conversions:
1. Отиди на **Configure** → **Events**
2. Намери event (напр. `download_ios`)
3. Кликни "Mark as conversion"

Препоръчителни conversions:
- `download_ios`
- `download_android`
- `cta_click`
- `form_submit`

## Интеграция с Google Search Console

1. В GA4 отиди на **Admin** → **Product Links**
2. Избери **Search Console**
3. Кликни **Link**
4. Избери твоя Search Console property
5. Кликни **Confirm**

Сега ще виждаш search queries в GA4!

## Debugging

### Ако не виждаш данни:

1. **Провери в браузъра:**
   - Отвори DevTools (F12)
   - Network tab
   - Търси request към `google-analytics.com/g/collect`
   - Трябва да има status 200

2. **Използвай GA Debugger:**
   - Инсталирай Chrome extension: "Google Analytics Debugger"
   - Активирай го
   - Refresh страницата
   - Виж console за GA events

3. **Провери Measurement ID:**
   - Уверете се, че ID-то е правилно
   - Формат: G-XXXXXXXXXX (не UA-XXXXXXX)

## Полезни ресурси:

- **GA4 Documentation:** https://support.google.com/analytics/
- **GA4 Demo Account:** https://analytics.google.com/analytics/web/demoAccount
- **YouTube Tutorials:** Search "Google Analytics 4 tutorial"

---

**Готово!** След deployment на кода, GA4 ще започне да събира данни автоматично. 🎉

**Забележка:** Първите данни могат да се появят след 24-48 часа за пълна обработка, но Realtime данни се виждат веднага.

