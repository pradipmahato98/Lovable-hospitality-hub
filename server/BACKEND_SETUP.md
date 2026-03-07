# Backend Setup Guide

## Architecture
This is a high-performance, isolated backend built with:
- **Framework**: Hono (TypeScript)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL with pgvector & RLS
- **Auth**: JWT with Argon2 hashing
- **Real-time**: Socket.io
- **Storage**: S3-compatible (MinIO)
- **Jobs**: BullMQ + Redis

## Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/luxestay
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_very_secure_long_random_secret
STORAGE_ENDPOINT=localhost
STORAGE_ACCESS_KEY=minioadmin
STORAGE_SECRET_KEY=minioadmin
STORAGE_BUCKET=luxestay-assets
RESEND_API_KEY=re_...
```

## Running Locally
1. Start infrastructure: `docker-compose up -d`
2. Install dependencies: `npm install`
3. Generate migrations: `npm run db:generate`
4. Apply migrations: `npm run db:migrate`
5. Start dev server: `npm run dev`

## API Documentation
OpenAPI docs are automatically generated and available at `/api/docs`.

## Security
- All connections are TLS 1.3+ ready.
- Sensitive data is encrypted at rest.
- RLS is enforced at the database level.
