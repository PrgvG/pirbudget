# template

Full-stack application with React frontend and Express backend.

## Structure

- `backend/` - Express server with TypeScript, Mongoose, and MongoDB
- `frontend/` - React application with TypeScript
- `nginx/` - Nginx configuration
- `mongodb/` - MongoDB database (via Docker)

## Локальный хостинг

Есть два способа запуска приложения локально:

### Вариант 1: Локальная разработка (рекомендуется для разработки)

**Преимущества:**
- Быстрая перезагрузка при изменениях
- Легкая отладка
- Hot reload для frontend и backend

**Шаги:**

1. **Установка зависимостей:**
```bash
npm install
```

2. **Настройка переменных окружения:**
```bash
# Создать .env файл для backend
cp backend/env.example backend/.env
```

3. **Запуск MongoDB (только БД в Docker):**
```bash
# Используйте скрипт для удобства
./scripts/start-dev.sh

# Или вручную:
docker-compose -p template-dev -f docker-compose.dev.yml up -d mongodb
```

4. **Проверка подключения к MongoDB:**
```bash
# MongoDB должен быть запущен (см. шаг 3)
```

5. **Запуск приложения:**
```bash
# Запустить frontend и backend одновременно
npm run dev

# Или отдельно:
# Терминал 1:
cd backend && npm run dev

# Терминал 2:
cd frontend && npm run dev
```

**Доступ:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- MongoDB (dev): `localhost:27018`
- Mongo Express (dev): `http://localhost:8081` (логин: admin, пароль: admin)

---

### Вариант 2: Production-like окружение (Docker)

**Преимущества:**
- Полная изоляция окружения
- Идентично production
- Nginx для проксирования

**Шаги:**

1. **Запуск всех сервисов:**
```bash
# Используйте скрипт
./scripts/start-prod.sh

# Или вручную:
docker-compose -p template-prod up -d --build
```

2. **Проверка статуса:**
```bash
docker-compose ps
```

**Доступ:**
- Frontend (через Nginx): `http://localhost`
- Backend API: `http://localhost/api`
- Backend напрямую: `http://localhost:3001`
- Health check: `http://localhost/health`
- MongoDB (prod): `localhost:27017`
- Mongo Express (prod): `http://localhost:8082` (логин: admin, пароль: admin)

**Управление:**
```bash
# Просмотр логов
docker-compose -p template-prod logs -f

# Просмотр логов конкретного сервиса
docker-compose -p template-prod logs -f backend
docker-compose -p template-prod logs -f frontend
docker-compose -p template-prod logs -f mongodb

# Остановка
docker-compose -p template-prod down

# Остановка с удалением volumes
docker-compose -p template-prod down -v
```

---

### Database Setup

MongoDB подключение настраивается через переменные окружения в `backend/.env` файле.

**Важно:** 
- **Dev окружение** (`docker-compose.dev.yml`) использует порт **27018** на хосте и имя проекта **template-dev**
- **Prod окружение** (`docker-compose.yml`) использует порт **27017** на хосте и имя проекта **template-prod**
- Это позволяет запускать оба инстанса MongoDB одновременно без конфликтов портов и контейнеров
- При использовании команд docker-compose вручную всегда указывайте имя проекта: `-p template-dev` или `-p template-prod`

## Scripts

### NPM скрипты (корневая папка):
- `npm run dev` - Запустить frontend и backend в режиме разработки
- `npm run build` - Собрать frontend и backend для production
- `npm run lint` - Проверить код линтером
- `npm run format` - Форматировать код с Prettier

### Скрипты для запуска:
- `./scripts/start-dev.sh` - Запустить MongoDB для разработки
- `./scripts/start-prod.sh` - Запустить все сервисы в Docker

### Backend скрипты:
- `npm run dev` - Запустить в режиме разработки с hot reload
- `npm run build` - Собрать для production
- `npm run start` - Запустить production сборку

### Frontend скрипты:
- `npm run dev` - Запустить dev сервер (Vite)
- `npm run build` - Собрать для production
- `npm run preview` - Предпросмотр production сборки

