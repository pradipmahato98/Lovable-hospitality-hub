# LuxeStay Custom Backend Architecture

This directory contains the custom backend implementation for LuxeStay ERP, designed to replace Supabase.

## Architecture Overview

- **Engine:** Node.js with Express and TypeScript.
- **Database:** PostgreSQL (with direct connection).
- **Authentication:** JWT-based custom identity system.
- **Real-time:** WebSockets via Socket.io.
- **Security:** End-to-End Encryption (E2EE) utilities for sensitive fields.

## Directory Structure

- `src/controllers`: Request handlers.
- `src/middleware`: Custom middleware (Auth, Error handling).
- `src/routes`: API route definitions.
- `src/services`: Business logic and database interactions.
- `src/utils`: Helper functions and security utilities.

## Core Features

1. **Custom Auth:** Fully controlled user management and role-based access.
2. **Database Control:** Direct access to PostgreSQL with schema management capabilities.
3. **Real-time Sync:** Efficient data broadcasting to connected clients.
4. **E2EE Support:** Tools to handle client-side encrypted data on the server.

## Getting Started

```bash
cd server
npm install
npm run dev
```
