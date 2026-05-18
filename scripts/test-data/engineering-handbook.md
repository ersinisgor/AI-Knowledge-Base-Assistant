# Engineering Handbook — TechNova Solutions

## Architecture Overview
TechNova Solutions builds a SaaS project management and analytics platform.

- Backend: NestJS (TypeScript, modular monolith)
- Database: PostgreSQL via Supabase with pgvector extension
- Realtime: WebSocket Gateway (Socket.io)
- AI Layer: LangChain with RAG pipeline
- Frontend: Next.js 15 with App Router
- Deployment: Docker containers on AWS ECS

## Authentication System
We use JWT-based authentication with RS256 signing.

- Access Token Expiry: 15 minutes
- Refresh Token Expiry: 7 days
- All endpoints must use AuthGuard middleware
- Tokens are verified on every request
- Rate limiting is enabled on auth endpoints
- IP blocking after 5 failed login attempts

## Password Policy
- Minimum 8 characters
- Must include uppercase letter
- Must include a number
- Must include a special character
- Password rotation every 90 days

## Deployment Process
- CI/CD via GitHub Actions
- Docker containers built and pushed to ECR
- Deployed on AWS ECS with auto-scaling
- Blue-green deployment strategy
- Health checks on /health endpoint
- Rollback within 5 minutes if health check fails

## Coding Standards
- Follow modular architecture with clear module boundaries
- Use DTOs for all input validation (class-validator)
- Write unit tests for all services (Jest)
- Minimum 80% code coverage required
- Use structured logging (JSON format)
- Never access database directly from controllers
- All async operations must have error handling

## Error Handling
- Use global exception filters
- Return consistent error format: { statusCode, message, error }
- Log all errors with context
- Never expose internal stack traces in production

## Code Review Process
- All PRs require at least 2 approvals
- PRs must pass CI pipeline (lint, test, build)
- Security-sensitive changes require security team review
- Breaking changes must be documented in CHANGELOG.md
