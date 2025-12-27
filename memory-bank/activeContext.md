# Активен контекст - Admin Login Subdomain Fix

## Текуща фокусна област
🔧 В ПРОЦЕС: Поправка на Admin Login с Custom Subdomain (api.fintrackwallet.com)

## Последни промени

### 🔧 Admin Login Subdomain Fix (27.12.2024 - ФИНАЛНО РЕШЕНИЕ)
- ✅ **Railway Custom Domain** - Добавен api.fintrackwallet.com
- ✅ **DNS Configuration** - CNAME запис в jump.bg (api → o44jco1u.up.railway.app)
- ✅ **Backend Config Update** - SESSION_COOKIE_SAMESITE='Lax', SESSION_COOKIE_DOMAIN='.fintrackwallet.com'
- ✅ **Frontend Update** - API_URL променен на https://api.fintrackwallet.com/api
- ✅ **CORS Update** - Добавен api.fintrackwallet.com в allowed origins

#### Проблем (преди):
Когато се логваш в админ панела от `fintrackwallet.com/admin/`, backend-ът беше на `fintrack-landing-page-production-f3af.up.railway.app`. Браузърите блокираха session cookies защото бяха **third-party cookies** (различни домейни).

#### Решение:
Използване на **subdomain** (`api.fintrackwallet.com`) вместо Railway URL. Сега:
- Frontend: `fintrackwallet.com`
- Backend: `api.fintrackwallet.com`

И двата споделят същия **eTLD+1** (`fintrackwallet.com`), което ги прави **same-site**. Браузърите приемат cookies с `SameSite=Lax`.

#### Технически промени:

**backend/config.py:**
```python
# Base Config
SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from 'None'
SESSION_COOKIE_DOMAIN = '.fintrackwallet.com'  # Share across subdomains
CORS_ORIGINS = [..., 'https://api.fintrackwallet.com']

# ProductionConfig
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_SAMESITE = 'Lax'  # Same-site subdomain
SESSION_COOKIE_DOMAIN = '.fintrackwallet.com'
```

**admin/index.html & admin/admin.js:**
```javascript
const API_URL = 'https://api.fintrackwallet.com/api';
const WS_URL = 'wss://api.fintrackwallet.com';
```

**index.html:**
```javascript
window.ANALYTICS_API_URL = 'https://api.fintrackwallet.com/api';
```

**DNS (jump.bg):**
```
Type: CNAME
Name: api
Value: o44jco1u.up.railway.app
```

#### Защо това работи:
- `fintrackwallet.com` и `api.fintrackwallet.com` имат същ root domain
- `SameSite=Lax` позволява cookies между same-site домейни
- `SESSION_COOKIE_DOMAIN='.fintrackwallet.com'` споделя cookies между subdomains
- По-сигурно от `SameSite=None` (не изисква third-party cookies)

#### Тестване:
1. Изчакай DNS propagation (15-30 мин)
2. Провери: `nslookup api.fintrackwallet.com` → трябва да покаже `o44jco1u.up.railway.app`
3. Deploy промените на Vercel и Railway
4. Тествай login на https://fintrackwallet.com/admin/
5. Session cookies трябва да се запазват успешно

---

### 🔧 Admin Login Session Fix (27.12.2024 - ПРЕДИШЕН ОПИТ)
- ✅ **Поправен SESSION_COOKIE_SAMESITE** - Променен от 'None' на 'Lax' за по-добра съвместимост
- ✅ **Добавен SESSION_COOKIE_DOMAIN** - Позволява same-origin cookies
- ✅ **Поправен DevelopmentConfig** - Конкретни CORS origins вместо wildcard
- ✅ **Подобрена CORS конфигурация** - Explicit headers и methods
- ✅ **Създадена документация** - ADMIN_LOGIN_FIX.md с пълно обяснение

#### Проблем:
Когато се логваш в админ панела (`/admin/index.html`), успешно влизаш, но когато отидеш на dashboard (`/admin/dashboard.html`), системата те връща обратно на login страницата.

#### Причина:
1. `SESSION_COOKIE_SAMESITE = 'None'` изискваше HTTPS и създаваше проблеми
2. `CORS_ORIGINS = ['*']` (wildcard) не работи с `supports_credentials=True`
3. Session cookies не се изпращаха правилно между login и dashboard

#### Решение:
**backend/config.py:**
```python
# Base Config
SESSION_COOKIE_SAMESITE = 'Lax'  # Changed from 'None'
SESSION_COOKIE_DOMAIN = None  # Allow same-origin cookies

# DevelopmentConfig
SESSION_COOKIE_SECURE = False  # Allow non-HTTPS in development
CORS_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5000',
    'http://localhost:8000',
    'http://127.0.0.1:8000'
]
```

**backend/app.py:**
```python
# CORS configuration with credentials support
cors_config = {
    'origins': app.config['CORS_ORIGINS'],
    'supports_credentials': True,
    'allow_headers': ['Content-Type', 'Authorization'],
    'expose_headers': ['Content-Type'],
    'methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}
CORS(app, **cors_config)
```

#### Тестване:
1. Рестартирай backend: `cd backend && python app.py`
2. Отвори `/admin/` и логни се
3. Трябва да влезеш директно в dashboard без redirect обратно

#### Файлове променени:
- `backend/config.py` - Session и CORS настройки
- `backend/app.py` - CORS конфигурация + Werkzeug fix
- `ADMIN_LOGIN_FIX.md` - Пълна документация на проблема и решението
- `TEST_ADMIN_LOGIN.md` - Резултати от backend тестовете

#### Deployment (27.12.2024):
- ✅ Commit: "Fix admin login session issue"
- ✅ Push към GitHub: успешен
- ✅ Railway auto-deployment: в процес
- ✅ Локални тестови файлове изтрити (index-local.html, dashboard-local.html, admin-local.js, ЛОКАЛНО_ТЕСТВАНЕ.md)

## Предишни промени

### 🚀 Performance Optimization - Максимална производителност (26.12.2024)
- ✅ **Оптимизация на изображенията** - Responsive loading с srcset, lazy loading
- ✅ **Премахнати неизползвани файлове** - Спестени ~4.5MB (83% намаление)
- ✅ **Оптимизация на external ресурси** - Async/defer зареждане на fonts и CDN
- ✅ **CSS оптимизация** - Критичен inline CSS + performance-optimizations.css
- ✅ **JavaScript оптимизация** - Throttle/debounce + passive events + GPU acceleration
- ✅ **Премахнати render-blocking ресурси** - Всички скриптове с defer
- ✅ **Добавени resource hints** - DNS prefetch, preconnect, preload
- ✅ **Оптимизация на анимации** - Throttled scroll listeners, оптимизиран Locomotive

#### Ключови подобрения:
**Изображения**:
- Премахнат `logo.png` (1.5MB) → Използват се оптимизирани версии (128KB-512KB)
- Премахнат `mockup-iphone.png` (2.7MB) → Responsive версии (49KB-192KB)
- Добавени srcset и sizes атрибути за всички изображения
- Lazy loading на всички изображения освен логото

**External ресурси**:
- Google Fonts: Намалени от 7 на 5 weights + async loading
- Font Awesome: Preload + async loading
- Locomotive Scroll: Preload CSS + defer JS
- Spline 3D: Modulepreload + defer

**JavaScript**:
- Добавени throttle и debounce функции
- Passive event listeners за по-добър scroll performance
- GPU acceleration (translate3d) вместо translateY
- Оптимизирани scroll listeners (от 6 на 6 throttled)
- Locomotive lerp увеличен от 0.08 на 0.15 за по-бърз отговор

**CSS**:
- Критичен CSS inline в `<head>` (~1.5KB minified)
- Нов файл `performance-optimizations.css` (5.7KB):
  - GPU acceleration за анимирани елементи
  - will-change оптимизации
  - contain за layout optimization
  - content-visibility за off-screen елементи
  - Mobile-specific оптимизации
  - prefers-reduced-motion support

**Resource hints**:
- DNS prefetch за 7 домейна
- Preconnect за 4 критични домейна
- Preload за styles.css и Spline viewer

**Резултати**:
- Размер на изображенията: От ~4.5MB на ~788KB (**-83%**)
- First Contentful Paint (FCP): Очаквано подобрение с ~1-2 секунди
- Largest Contentful Paint (LCP): Очаквано подобрение с ~1.5-2.5 секунди
- CPU използване при scroll: Намалено с ~40-60%
- **НЯМА визуални промени** - сайтът изглежда абсолютно същия

## Предишни промени

### 🎯 Hero Desktop Navigation - FinTrack Custom Style (24.12.2024)
- ✅ **Minimalist FinTrack Design** - Персонализиран дизайн в стила на сайта
- ✅ **Тъмна цветова палитра** - #2c2c2c акценти вместо purple/blue
- ✅ **Refined Glassmorphism** - Суптилни прозрачности с тъмни тонове
- ✅ **Animated Lamp Indicator** - Елегантна бяла "лампа" с минимална индикаторна лента
- ✅ **Bulgarian Text** - Навигация на български: Начало, Функции, Отзиви, Изтегли
- ✅ **Desktop Only** - Показва се само на desktop (>1024px)
- ✅ **Static Position** - Остава в hero секцията, не скролва със страницата
- ✅ **Locomotive Scroll Integration** - Интегрирана с Locomotive Scroll за плавен скрол

#### Design Specifications - FinTrack Style
**Navigation Container (`.hero-desktop-nav`)**:
- Position: Absolute - top: 30px, right: 50px
- Z-index: 1000
- Animation: fadeInDown (1s, 0.3s delay)
- Font: Inter (съответства на brand typography)

**Pill Container (`.nav-pill`)**:
- Background: rgba(44, 44, 44, 0.05) - тъмен тон
- Border: 1px solid rgba(44, 44, 44, 0.08)
- Backdrop-filter: blur(20px)
- Border-radius: 50px
- Padding: 4px (компактен)
- Gap: 4px между елементите
- Box-shadow: 
  - 0 4px 20px rgba(0, 0, 0, 0.08)
  - inset 0 1px 0 rgba(255, 255, 255, 0.6) - внътрешен highlight
- Hover: Enhanced border и shadow

**Navigation Items (`.nav-pill-item`)**:
- Padding: 12px 24px (просторен)
- Font-family: 'Inter', sans-serif
- Font-size: 13px, Font-weight: 500
- Letter-spacing: 1.2px
- Text-transform: UPPERCASE (като brand-title)
- Color: rgba(44, 44, 44, 0.45) (inactive)
- Hover: rgba(44, 44, 44, 0.75)
- Active: #2c2c2c (пълен тъмен цвят)
- Border-radius: 50px
- Transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1)

**Lamp Effect (`.nav-pill-lamp`)**:
- Background: Linear gradient white (elegant)
  - rgba(255, 255, 255, 0.95) → rgba(255, 255, 255, 0.85)
- Width: 25% - 4px
- Height: 100% - 8px
- Border-radius: 50px
- Transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1) (по-бавен за elegance)
- Box-shadow: 
  - 0 2px 12px rgba(44, 44, 44, 0.12)
  - inset 0 1px 0 rgba(255, 255, 255, 1) - glossy finish
  - 0 4px 24px rgba(44, 44, 44, 0.08)

**Minimalist Indicator Bar (`.nav-pill-lamp::before`)**:
- Top bar: 24px width, 2px height (фин)
- Background: #2c2c2c
- Border-radius: 2px
- Opacity: 0.85
- Без glow - минималистичен подход

**Subtle Shadow (`.nav-pill-lamp::after`)**:
- Radial gradient под лампата
- Subtler effect: rgba(44, 44, 44, 0.15)
- Filter: blur(3px)
- По-малък размер за фин детайл

#### Navigation Items - FinTrack Sections
1. **Начало** (#hero) - Hero секция
2. **Функции** (#features) - Features/Phone секция
3. **Отзиви** (#testimonials) - Testimonials секция
4. **Изтегли** (#download) - Download секция

#### JavaScript Functionality
**Function: `initHeroDesktopNav()`**:
- Click handler за навигационните елементи
- Плавен scroll към секциите (Locomotive Scroll или native)
- Manual active state при клик
- Интегриран с Locomotive Scroll за smooth scrolling

**Behavior**:
- Статична позиция в hero секцията
- Активното състояние се променя само при клик
- Не следи scroll позицията (остава в hero)
- Изчезва когато потребителят скролне надолу

#### Responsive Behavior
- **Desktop (>1024px)**: Пълна видимост
- **Tablet & Mobile (≤1024px)**: Скрита (display: none)

#### Technical Implementation
- **HTML**: Semantic nav структура в hero секцията
- **CSS**: 
  - Glassmorphism с backdrop-filter
  - Complex positioning система за lamp
  - CSS :has() селектор за lamp позициониране
  - Multiple pseudo-elements за light effects
- **JavaScript**:
  - Event listeners за click
  - Scroll tracking
  - Locomotive Scroll integration
  - Active state management

## Предишни промени

### 🎯 Seamless Entrance Animations System (11.12.2024)

### 🎯 Seamless Entrance Animations System (11.12.2024)
- ✅ **CSS Reveal Classes** - Добавена пълна система за reveal анимации
- ✅ **JavaScript Intersection Observer** - Автоматично засичане на видими секции
- ✅ **Staggered Animations** - Child елементи се появяват последователно
- ✅ **Parallax Effects** - Floating елементи се движат с различна скорост
- ✅ **Section-specific animations** - Всяка секция има custom entrance анимация
- ✅ **Smooth momentum scrolling** - Плавен scroll без прекъсвания
- ✅ **Reduced motion support** - Респектиране на accessibility настройки

#### Нови CSS класове
- `.reveal` - базово появяване отдолу нагоре
- `.reveal-left` - появяване от ляво
- `.reveal-right` - появяване от дясно  
- `.reveal-scale` - появяване със scale
- `.reveal-rotate` - появяване с rotate
- `.reveal-fade` - само fade без движение
- `.stagger-children` - staggered анимации за child елементи
- `.parallax-slow/medium/fast` - parallax layers
- `.section-visible` - автоматично добавян клас при scroll

#### Timing & Easing
- Primary easing: `cubic-bezier(0.16, 1, 0.3, 1)` - smooth out
- Duration: 0.7s - 1s за повечето елементи
- Stagger delay: 0.1s между child елементи

#### JavaScript система
- `initSeamlessReveal()` - основен Intersection Observer
- `initParallaxEffects()` - parallax на floating елементи
- `initSmoothMomentum()` - momentum scrolling state

### 🎯 Phone Mockup Image Integration (09.11.2024)
- ✅ **Организация на файлове** - Създадена нова папка `assets/mockups/`
- ✅ **Преместване на изображение** - `mockup Iphone.png` → `assets/mockups/mockup-iphone.png`
- ✅ **HTML обновление** - Заменен placeholder елемент с реално изображение
- ✅ **CSS стилизация** - Добавени стилове за `.phone-mockup-image`
- ✅ **Hover ефект** - Scale + translateY анимация при hover
- ✅ **Responsive дизайн** - Адаптивни размери за всички устройства
  - Desktop: max-width 400px
  - Tablet: max-width 300px
  - Mobile: max-width 250px
- ✅ **Drop shadow** - Професионален shadow ефект вместо стари phone frame стилове

#### Design Specifications
**Phone Mockup Image**:
- Max-width: 400px (desktop), 300px (tablet), 250px (mobile)
- Height: auto (запазва aspect ratio)
- Filter: drop-shadow(0 30px 80px rgba(0, 0, 0, 0.4))
- Transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)
- Hover: scale(1.05) + translateY(-10px)

#### Премахнати елементи
- `.phone-frame` - Стар phone frame wrapper
- `.phone-screen` - Стар screen container
- `.phone-placeholder` - Placeholder икона и текст
- Phone frame pseudo-elements (notch simulation)

## Предишни промени

### 🎯 Features Section Header Update (31.10.2024)
- ✅ **Унифициран стил** - Заглавието сега следва дизайна на Pain & Fear секциите
- ✅ **UPPERCASE типография** - Драматичен bold текст (72px, font-weight 800)
- ✅ **Пулсиращ badge** - Анимиран badge с glow ефект
- ✅ **Консистентен spacing** - Letter-spacing: -2px, line-height: 0.95
- ✅ **Responsive дизайн** - Адаптивни размери за всички устройства

#### Design Specifications
**Badge (.phone-badge)**:
- Font-size: 12px (desktop), 10px (tablet), 9px (mobile)
- Letter-spacing: 2.5px
- Border: 2px solid rgba(102, 126, 234, 0.4)
- Background: Linear gradient (purple tones)
- Animation: badgePulse (3s infinite)
- Box-shadow: Glow effect
- Emoji: ✨ префикс

**Title (.phone-title)**:
- Font-size: 72px (desktop), 48px (tablet), 36px (mobile)
- Font-weight: 800
- Line-height: 0.95
- Letter-spacing: -2px
- Color: #2c2c2c
- Text-transform: UPPERCASE
- Text: "ВСИЧКО ОТ КОЕТО СЕ НУЖДАЕТЕ"

**Subtitle (.phone-subtitle)**:
- Font-size: 18px (desktop), 16px (tablet), 14px (mobile)
- Font-weight: 500
- Color: rgba(44, 44, 44, 0.75)
- Max-width: 700px
- Line-height: 1.6
- Letter-spacing: 0.3px

#### Animation Details
```css
@keyframes badgePulse {
    0%, 100%: scale(1), box-shadow: 0 0 25px rgba(102, 126, 234, 0.3)
    50%: scale(1.02), box-shadow: 0 0 35px rgba(102, 126, 234, 0.5)
}
```

#### Responsive Breakpoints
- **Desktop (>1200px)**: Full size - 72px title
- **Tablet (768px-1200px)**: Medium - 48px title
- **Mobile (<768px)**: Small - 36px title

## Предишни промени

### 🎯 Bento Grid Features Section
- ✅ **CSS Grid Layout** - 4 колони с различни размери карти
- ✅ **Асиметричен дизайн** - Large, Wide, Medium и Small карти
- ✅ **Glassmorphism ефект** - Semi-transparent background с backdrop-filter
- ✅ **Gradient икони** - 7 различни цветни градиента
- ✅ **Интерактивни ефекти** - 3D tilt, glow tracking, hover animations

#### Структура на Bento Grid
1. **Grid System**:
   - 4 колони на desktop (repeat(4, 1fr))
   - Gap: 20px между картите
   - Auto rows: 280px height
   - Responsive: 3 колони (tablet), 1 колона (mobile)

2. **Card Types** (7 функции):
   - **Large** (2×2): Гамификация с emoji visual
   - **Medium** (1×1): Финансово здраве, QR Scanner, Бюджети
   - **Wide** (2×1): Интелигентна аналитика с chart визуализация
   - **Small** (1×1): What-If, AI Асистент

3. **Visual Elements по карти**:
   - **Gamification**: Пулсиращ emoji 🎮, stat pills
   - **Health Index**: Animated bars (grow animation)
   - **QR Scanner**: 4 pulsing dots в grid
   - **Analytics**: Chart lines с rise animation
   - **Budget**: Concentric rings с expand animation

#### Modern Design Elements
- **Glassmorphism**: rgba(255,255,255,0.7) + blur(20px)
- **Border gradient**: Animated gradient border при hover
- **Card glow**: Mouse-tracking radial gradient
- **3D tilt**: Perspective transform based на mouse position
- **Entrance animations**: Staggered fadeIn + translateY

#### Gradient Color Palette
- **Purple** (#667eea → #764ba2): Gamification
- **Green** (#11998e → #38ef7d): Health Index
- **Blue** (#4facfe → #00f2fe): QR Scanner
- **Orange** (#fa709a → #fee140): Analytics
- **Pink** (#f093fb → #f5576c): What-If
- **Indigo** (#5f72bd → #9b23ea): AI Assistant
- **Teal** (#13547a → #80d0c7): Budget Goals

#### Hover Effects
- **Card**: 
  - translateY(-8px)
  - Enhanced box-shadow (0 20px 60px)
  - Border gradient появява се
  - 3D perspective tilt
- **Icon**: Scale(1.1) + rotate(5deg)
- **Glow**: Opacity 0 → 1, следва mouse position
- **Visual elements**: Opacity increase, color enhance

#### JavaScript Interactions
- **Mouse tracking glow**: Real-time radial gradient update
- **3D tilt effect**: RotateX/Y based на mouse position
- **Intersection Observer**: Trigger animations при scroll
- **Smooth transitions**: RequestAnimationFrame за performance

#### Анимации
- **cardFadeIn**: 0→1 opacity + translateY(30px→0)
- **gentlePulse**: Scale 1→1.05 за emoji
- **barGrow**: Height 0→full за health bars
- **qrPulse**: Scale + opacity за QR dots
- **chartRise**: Height + opacity за chart lines
- **ringExpand**: Scale 1→1.1 за goal rings

#### Header Design
- **Badge**: Pill shape с border, subtle background
- **Title**: 56px, font-weight 800, letter-spacing -2px
- **Subtitle**: 18px, rgba(44,44,44,0.65)
- **Alignment**: Center текст

#### Технически детайли
- **HTML**: Semantic structure с data-feature attributes
- **CSS**: 
  - CSS Grid за основен layout
  - Flexbox за card съдържание
  - Backdrop-filter за glassmorphism
  - Multiple keyframe animations
  - Complex hover states
- **JavaScript**: 
  - Event listeners за mouse tracking
  - Perspective calculations
  - Intersection Observer API
  - Dynamic style manipulation

#### Responsive Breakpoints
- **Desktop (>1200px)**: 4 колони, full grid layout
- **Tablet (768px-1200px)**: 3 колони, wide cards span 3
- **Mobile (<768px)**: 
  - 1 колона vertical stack
  - All cards same size
  - Min-height 200px
  - Reduced font sizes

## Реализирани промени в Fear секцията

### 🎯 Драматични Layout промени
- ✅ **Заглавие преместено доста наляво**: Отрицателен margin за екстремна позиция
- ✅ **Силно асиметричен дизайн**: Драматичен визуален ефект
- ✅ **Margin-left: -100px**: Изтласкване извън стандартните граници
- ✅ **Увеличена max-width**: От 1200px на 1400px за повече пространство

## Стилови характеристики

### 🎨 Visual Language
- **Soft, ethereal aesthetics**: Glassmorphism + subtle colors
- **Playful interactions**: 3D tilt, glow tracking
- **Smooth animations**: Cubic-bezier easing
- **Consistent spacing**: 20px gaps, 32px padding
- **Modern typography**: -2px letter-spacing за titles

### 🔮 Inspiration
- Apple-style bento grids
- Linear.app design system
- Arc browser aesthetics
- Modern SaaS landing pages

## Следващи стъпки
- Възможно добавяне на микроинтеракции при click
- A/B тестване на конверсии
- Performance optimization за animations
- Добавяне на accessibility features (keyboard navigation)
- Възможни video/lottie animations вътре в картите
