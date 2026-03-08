# LuxeStay ERP — Isolated Backend System

Production-grade, fully isolated backend architecture for LuxeStay ERP.

## 🚀 Architecture Overview
- **Engine**: Node.js with Hono (Ultra-fast, TypeScript-first)
- **Database**: PostgreSQL 16+ with `pgvector`, `pg_cron`, and `pg_net`
- **ORM**: Drizzle ORM (Type-safe migrations and queries)
- **Auth**: RS256 JWT (Access/Refresh), Argon2 hashing, MFA (TOTP), RBAC middleware
- **Real-time**: Socket.io + PostgreSQL `LISTEN/NOTIFY` (logical sync)
- **Storage**: S3-compatible (MinIO) with direct streaming and pre-signed URLs
- **Queue**: BullMQ + Redis for background jobs and webhook delivery
- **Security**: AES-256-GCM field-level encryption for sensitive PII data

## 📡 API Reference

### Auth (`/api/v1/auth`)
- `POST /register`: Create a new user (Argon2 hash)
- `POST /login`: Authenticate and receive RS256 JWTs
- `POST /refresh`: Rotate access token using refresh cookie
- `POST /logout`: Blacklist session and clear cookies

### Core API (`/api/v1`)
- `GET /rooms`: Paginated room list
- `GET /guests`: CRUD for guest profiles
- `GET /reservations`: Secure reservation management
- `GET /role_permissions`: RBAC matrix management

### Storage (`/api/v1/storage`)
- `POST /upload?bucket=...`: Multipart upload to S3/MinIO
- `GET /url/:bucket/:key`: Generate 1-hour pre-signed access URL

## 🛠️ Local Development Setup

### 1. Start Infrastructure
```bash
cd server
docker-compose up -d
```

### 2. Generate RSA Keys
```bash
./scripts/generate-keys.sh
```

### 3. Initialize Database
```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
```

### 4. Run Application
```bash
npm run dev
```

## 🔐 Production Deployment
- **TLS**: Use an Nginx or Caddy reverse proxy to enforce TLS 1.3.
- **Secrets**: Provide `JWT_PRIVATE_KEY` and `JWT_PUBLIC_KEY` via Environment Variables.
- **RLS**: Policies are automatically applied via `init-db/02-rls-policies.sql`.

## 📊 Monitoring
- **Health Check**: `GET /api/v1/health`
- **Error Tracking**: Set `SENTRY_DSN` in your environment.
