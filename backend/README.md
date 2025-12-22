# FinTrack Analytics Backend

Python Flask backend за проследяване на analytics събития и admin dashboard.

## Setup

### 1. Инсталация на зависимости

```bash
cd backend
pip install -r requirements.txt
```

### 2. Конфигурация

Създайте `.env` файл (копирайте от `.env.example`):

```bash
cp .env.example .env
```

Редактирайте `.env` файла с вашите настройки.

### 3. Генериране на admin парола

```bash
python auth.py yourSecurePassword123
```

Копирайте генерирания hash в `.env` файла като `ADMIN_PASSWORD_HASH`.

### 4. Database Setup

Създайте PostgreSQL база данни:

```bash
createdb fintrack_analytics
```

Изпълнете SQL schema:

```bash
psql -d fintrack_analytics -f database.sql
```

### 5. Стартиране

Development mode:

```bash
python app.py
```

Production mode (с Gunicorn):

```bash
gunicorn -k eventlet -w 1 --bind 0.0.0.0:5000 app:app
```

## API Endpoints

### Public Endpoints (Tracking)

- `POST /api/track/visit` - Записва page visit
- `POST /api/track/click` - Записва click event
- `POST /api/track/consent` - Записва GDPR consent

### Admin Endpoints (Authentication Required)

- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/check` - Проверка на authentication status

### Admin Dashboard Endpoints

- `GET /api/stats/summary` - Summary статистики
- `GET /api/stats/chart-data` - Данни за графики
- `GET /api/events/recent` - Последни събития

### WebSocket Events

- `connect` - Свързване към WebSocket
- `disconnect` - Изключване
- `ping` - Keep-alive ping
- `new_visit` - Ново посещение (broadcast)
- `new_click` - Ново кликване (broadcast)
- `active_users_update` - Update на активни потребители

## Deployment

### Railway

1. Push към GitHub
2. Свържете Railway към repo
3. Добавете PostgreSQL service
4. Добавете environment variables
5. Deploy

### Render

1. Push към GitHub
2. Създайте Web Service в Render
3. Добавете PostgreSQL database
4. Добавете environment variables
5. Deploy

## Environment Variables

Вижте `.env.example` за списък с всички променливи.

