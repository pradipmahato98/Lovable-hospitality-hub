# Backend Setup Guide

## Architecture
- **Framework**: Hono (TypeScript)
- **ORM**: Drizzle ORM
- **Database**: PostgreSQL with pgvector & RLS
- **Security**: AES-256 field-level encryption, RS256 JWT
- **Observability**: Sentry integration, RFC 7807 Errors

## Setup Instructions

1. **Infrastructure**:
   Run `docker-compose up -d` to start Postgres, Redis, MinIO, and ClamAV.

2. **Keys**:
   Run `./scripts/generate-keys.sh` to generate RSA keys for JWT signing.

3. **Environment**:
   Copy `.env.example` to `.env` and fill in the required variables.

4. **Database**:
   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

5. **Run**:
   `npm run dev`
