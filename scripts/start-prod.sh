#!/bin/bash

# Скрипт для запуска production-like окружения в Docker

echo "🚀 Запуск production окружения в Docker..."

# Запускаем все сервисы
echo "📦 Запускаем все сервисы..."
docker-compose -p template-prod up -d --build

echo "✅ Все сервисы запущены!"
echo ""
echo "📍 Доступ к приложению:"
echo "   Frontend: http://localhost"
echo "   Backend API: http://localhost/api"
echo "   Backend напрямую: http://localhost:3001"
echo "   Health check: http://localhost/health"
echo "   Mongo Express: http://localhost:8082 (логин: admin, пароль: admin)"
echo ""
echo "📊 Просмотр логов: docker-compose -p template-prod logs -f"
echo "🛑 Остановка: docker-compose -p template-prod down"

