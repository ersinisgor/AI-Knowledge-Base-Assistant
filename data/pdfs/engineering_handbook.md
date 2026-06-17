# Engineering Handbook — TechNova Solutions

## Architecture Overview

TechNova Solutions is built on a modular monolith architecture inspired by microservices principles.

- **Backend:** NestJS (TypeScript, strict mode)
- **Database:** PostgreSQL via Supabase (with pgvector for AI features)
- **Realtime:** WebSocket Gateway using Socket.io
- **AI Layer:** LangChain with RAG pipeline (vector search + GPT-4o-mini)
- **Queue:** Bull (Redis-backed) for async ingestion jobs
- **Storage:** Supabase Storage for file uploads

## Authentication

We use JWT-based authentication with a dual-token strategy.

- **Access Token Expiry:** 15 minutes
- **Refresh Token Expiry:** 7 days
- **Signing Algorithm:** RS256 (asymmetric key pair)
- **Token Storage:** Access token in memory; refresh token in HttpOnly cookie

All endpoints must be protected by the `AuthGuard` middleware unless explicitly marked as public using the `@Public()` decorator.

Refresh token rotation is enabled: each time a refresh token is used, it is invalidated and a new one is issued.

## Deployment

- **CI/CD:** GitHub Actions (runs lint, test, build on every PR)
- **Containerization:** Docker (multi-stage builds)
- **Hosting:** AWS ECS (Fargate) for backend, Vercel for frontend
- **Database:** Supabase (managed PostgreSQL)
- **Environment promotion:** dev → staging → production (manual approval required for production)

## Coding Standards

- Follow modular architecture: each feature lives in its own NestJS module
- Use DTOs with `class-validator` decorators for all controller inputs
- Write unit tests for all service methods (coverage target: 80%)
- Use the repository pattern — never access the database directly from a controller
- All async operations must handle errors explicitly; avoid silent failures
- Use structured logging (`Winston`) with correlation IDs for traceability

## On-call Policy

On-call rotation is weekly. The on-call engineer is expected to:
- Acknowledge alerts within 15 minutes
- Resolve P1 incidents within 1 hour
- File a post-mortem within 48 hours of any P1 incident

Contact the on-call engineer via PagerDuty or the `#oncall` Slack channel.

## Code Review Policy

- Minimum 1 approval required to merge (2 for changes to authentication or billing)
- PRs should be small: aim for < 400 lines changed
- All CI checks must pass before merging
- Squash merges are preferred to keep history clean
