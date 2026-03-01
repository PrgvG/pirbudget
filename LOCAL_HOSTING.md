# Инструкция по локальному хостингу

## Быстрый старт

### Для разработки (рекомендуется):

```bash
# 1. Установить зависимости
npm install

# 2. Запустить MongoDB
./scripts/start-dev.sh

# 3. Настроить переменные окружения
cd backend
cp env.example .env
cd ..

# 4. Запустить приложение
npm run dev
```

**Доступ:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001

---

### Для production-like окружения:

```bash
# Запустить все в Docker
./scripts/start-prod.sh
```

**Доступ:**
- Приложение: http://localhost
- API: http://localhost/api

---

## Подробная настройка

### Требования

- Node.js 20+
- Docker и Docker Compose
- npm или yarn

### Шаг 1: Установка зависимостей

```bash
# В корневой папке проекта
npm install
```

### Шаг 2: Настройка переменных окружения

#### Для локальной разработки:

```bash
# Backend
cd backend
cp env.example .env
# Отредактируйте .env при необходимости
cd ..
```

Файл `backend/.env` должен содержать:
```env
# Для dev окружения используйте порт 27018
DATABASE_URL="mongodb://admin:password@localhost:27018/template?authSource=admin"
PORT=3001
NODE_ENV=development
```

### Шаг 3: Настройка базы данных

#### Вариант A: Только MongoDB в Docker (для разработки)

```bash
# Запустить только MongoDB
docker-compose -p template-dev -f docker-compose.dev.yml up -d mongodb

# Проверить статус
docker ps | grep mongodb
```

#### Вариант B: Все в Docker (production-like)

```bash
# Запустить все сервисы
docker-compose -p template-prod up -d --build
```

### Шаг 4: Проверка подключения к MongoDB

MongoDB подключение настраивается автоматически через переменные окружения в `backend/.env` файле.

### Шаг 5: Запуск приложения

#### Локальная разработка:

```bash
# Запустить frontend и backend одновременно
npm run dev
```

Или отдельно в разных терминалах:
```bash
# Терминал 1 - Backend
cd backend && npm run dev

# Терминал 2 - Frontend
cd frontend && npm run dev
```

#### Production-like (Docker):

```bash
docker-compose -p template-prod up -d
```

---

## Управление сервисами

### MongoDB (dev окружение)

```bash
# Запустить
docker-compose -p template-dev -f docker-compose.dev.yml up -d mongodb

# Остановить
docker-compose -p template-dev -f docker-compose.dev.yml down

# Просмотр логов
docker-compose -p template-dev -f docker-compose.dev.yml logs -f mongodb

# Подключиться к MongoDB
docker exec -it template-mongodb-dev mongosh -u admin -p 'password' --authenticationDatabase admin
```

### Docker Compose (production-like)

```bash
# Запустить все сервисы
docker-compose -p template-prod up -d

# Остановить все сервисы
docker-compose -p template-prod down

# Пересобрать и запустить
docker-compose -p template-prod up -d --build

# Просмотр логов
docker-compose -p template-prod logs -f

# Просмотр логов конкретного сервиса
docker-compose -p template-prod logs -f backend
docker-compose -p template-prod logs -f frontend
docker-compose -p template-prod logs -f mongodb

# Остановить и удалить volumes
docker-compose -p template-prod down -v
```

---

## Полезные команды

### Проверка работы

```bash
# Health check backend
curl http://localhost:3001/health

# Health check через Nginx (если запущен в Docker)
curl http://localhost/health

# Проверка API
curl http://localhost:3001/api
curl http://localhost/api  # через Nginx
```

---

## Порты

- **3000** - Frontend (Vite dev server)
- **3001** - Backend (Express)
- **80** - Frontend через Nginx (Docker)
- **27017** - MongoDB (prod окружение, docker-compose.yml)
- **27018** - MongoDB (dev окружение, docker-compose.dev.yml)
- **8081** - Mongo Express (dev окружение, docker-compose.dev.yml)
- **8082** - Mongo Express (prod окружение, docker-compose.yml)

## Доступ из локальной сети

Приложение настроено для доступа из локальной сети (не только localhost).

### Узнать IP адрес вашей машины:

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# или
ipconfig getifaddr en0  # macOS
```

**Windows:**
```bash
ipconfig
```

### Доступ к приложению:

После запуска приложения, другие устройства в вашей локальной сети могут получить доступ:

- **Frontend (dev):** `http://YOUR_IP:3000`
- **Backend:** `http://YOUR_IP:3001`
- **Frontend (Docker):** `http://YOUR_IP`

Например, если ваш IP `192.168.1.100`:
- Frontend: `http://192.168.1.100:3000`
- Backend: `http://192.168.1.100:3001`

---

## Решение проблем

### Порт уже занят

```bash
# Найти процесс, использующий порт
lsof -i :3001
lsof -i :3000
lsof -i :27017  # MongoDB prod
lsof -i :27018  # MongoDB dev

# Остановить процесс
kill <PID>
```

### MongoDB не запускается

```bash
# Проверить логи
docker-compose -p template-dev -f docker-compose.dev.yml logs mongodb

# Пересоздать контейнер
docker-compose -p template-dev -f docker-compose.dev.yml down -v
docker-compose -p template-dev -f docker-compose.dev.yml up -d mongodb
```

### Ошибки подключения к БД

1. Проверьте, что MongoDB запущен:
```bash
docker ps | grep mongodb
```

2. Проверьте DATABASE_URL в `.env` файле

3. Проверьте логи:
```bash
# Для dev окружения:
docker-compose -p template-dev -f docker-compose.dev.yml logs mongodb

# Для prod окружения:
docker-compose -p template-prod logs mongodb
```

---

## Автозапуск при загрузке системы (macOS)

Для автоматического запуска MongoDB при загрузке системы:

1. Создайте файл `~/Library/LaunchAgents/com.template.mongodb.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.template.mongodb</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/docker-compose</string>
        <string>-f</string>
        <string>/Users/YOUR_USERNAME/Repos/template/docker-compose.dev.yml</string>
        <string>up</string>
        <string>-d</string>
        <string>mongodb</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/YOUR_USERNAME/Repos/template</string>
</dict>
</plist>
```

2. Замените `YOUR_USERNAME` на ваше имя пользователя

3. Загрузите:
```bash
launchctl load ~/Library/LaunchAgents/com.template.mongodb.plist
```

