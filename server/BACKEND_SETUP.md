# LuxeStay ERP — Isolated Backend System

This is a production-grade, fully isolated backend built to provide a secure and scalable alternative to Supabase.

## 🚀 Architecture Overview
- **Engine**: Node.js with Hono (TypeScript)
- **Database**: PostgreSQL (latest) with `pgvector`, `pg_cron`, and `pg_net`
- **ORM**: Drizzle ORM for type-safe database interactions
- **Auth**: RS256 JWT (Access/Refresh), Argon2 hashing, MFA (TOTP), RBAC
- **Real-time**: Socket.io + PG `LISTEN/NOTIFY` synchronization
- **Storage**: S3-compatible (MinIO) with pre-signed URL security
- **Queue**: BullMQ + Redis for background jobs and webhooks
- **Security**: AES-256-GCM field-level encryption for PII

## 🛠️ Local Development Setup

### 1. Infrastructure
Ensure Docker is running, then start the services:
```bash
cd server
docker-compose up -d
```

### 2. RSA Key Generation
Generate the RS256 keys for JWT signing:
```bash
./scripts/generate-keys.sh
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure the secrets:
```bash
cp .env.example .env
```

### 4. Database Initialization
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 5. Start Server
```bash
npm run dev
```

## 🔐 Security Considerations
- **E2EE Ready**: Use `encrypt()` / `decrypt()` utilities in `src/utils/encryption.ts` for field-level security.
- **RLS**: Row Level Security is enabled by default via `init-db/02-rls-policies.sql`.
- **TLS**: All connections are enforced to use TLS 1.3 in production.

## 📊 Observability
- **Health Check**: `GET /api/v1/health`
- **Error Tracking**: Integrated with Sentry (set `SENTRY_DSN` in `.env`)
- **Logging**: Structured JSON logging to console.

## 📡 API Clients
- **Swagger UI**: Visit `http://localhost:3000/api/docs` (if enabled)
- **Frontend Sync**: Use the generated types from `npm run db:generate`.
