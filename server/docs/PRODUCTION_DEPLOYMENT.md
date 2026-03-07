# Backend Production Config

## Security
- **TLS 1.3**: Enforced via Load Balancer / Nginx (see `nginx.conf`)
- **Encryption**: AES-256-GCM for PII data
- **Backups**: Daily encrypted S3 backups (configured via `pg_dump` cron)

## Monitoring
- **Health**: `/health` provides status of DB, Cache, and Storage
- **Logging**: Structured JSON logging to stdout
- **Errors**: Sentry integration enabled via `SENTRY_DSN`

## GDPR
- **Export**: `GET /api/v1/user/export`
- **Delete**: `DELETE /api/v1/user/account`
