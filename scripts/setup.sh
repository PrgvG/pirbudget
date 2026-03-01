#!/bin/bash

# Скрипт для первоначальной настройки проекта

# Переходим в корень проекта (родительская директория от scripts)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

echo "🚀 Настройка проекта pirbudget..."

# Установка зависимостей в корне
echo "📦 Устанавливаем зависимости корневого проекта..."
npm install

# Установка зависимостей backend
echo "📦 Устанавливаем зависимости backend..."
cd backend
npm install

# Создание .env файла если его нет
if [ ! -f .env ]; then
  echo "📝 Создаем .env файл..."
  if [ -f env.example ]; then
    cp env.example .env
    echo "✅ .env файл создан. Проверьте настройки в backend/.env"
  else
    echo "⚠️  Файл env.example не найден, пропускаем создание .env"
  fi
fi

cd ..

# Установка зависимостей frontend
echo "📦 Устанавливаем зависимости frontend..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Настройка завершена!"
echo ""
echo "Следующие шаги:"
echo "1. Запустите MongoDB: ./scripts/start-dev.sh"
echo "2. Запустите приложение: npm run dev"
echo ""

