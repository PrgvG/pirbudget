#!/bin/bash

# Скрипт для запуска локальной разработки
# Запускает только MongoDB в Docker, остальное локально

# Переходим в корень проекта (родительская директория от scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

echo "🚀 Запуск локальной разработки..."

# Проверяем, запущен ли MongoDB
if ! docker ps | grep -q template-mongodb-dev; then
  echo "📦 Запускаем MongoDB и Mongo Express..."
  docker-compose -p template-dev -f docker-compose.dev.yml up -d mongodb mongo-express
  echo "⏳ Ждем запуска MongoDB..."
  sleep 3
else
  echo "✅ MongoDB уже запущен"
  # Проверяем, запущен ли Mongo Express
  if ! docker ps | grep -q template-mongo-express-dev; then
    echo "📦 Запускаем Mongo Express..."
    docker-compose -p template-dev -f docker-compose.dev.yml up -d mongo-express
  else
    echo "✅ Mongo Express уже запущен"
  fi
fi

# Проверяем наличие .env файлов
if [ ! -f backend/.env ]; then
  echo "📝 Создаем .env файл для backend..."
  cp backend/env.example backend/.env
fi

# Проверяем установлены ли зависимости
if [ ! -d backend/node_modules ]; then
  echo "📦 Устанавливаем зависимости backend..."
  cd backend && npm install && cd ..
fi

echo ""
echo "✅ Готово! Теперь запустите: npm run dev"
echo ""
echo "🌐 Веб-интерфейс MongoDB доступен по адресу:"
echo "   http://localhost:8081"
echo "   Логин: admin"
echo "   Пароль: admin"
echo ""

