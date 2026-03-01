# Backend

Express backend with TypeScript, Mongoose, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. MongoDB подключение настраивается автоматически через переменные окружения.

## Development

```bash
npm run dev
```

## Environment Variables

- `DATABASE_URL` - MongoDB connection string
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)

