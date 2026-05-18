#!/bin/bash
# TechNova Solutions - Test Data Seed Script
# Usage: Run this after both backend (port 3000) and frontend (port 3001) are running
# ./scripts/seed-test-data.sh

set -e

API="${1:-http://localhost:3000}"

echo "🏢 TechNova Solutions — Test Data Seeder"
echo "📡 API: $API"
echo ""

# Check if backend is reachable
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$API/" 2>/dev/null || echo "000")
if [ "$HEALTH" = "000" ]; then
  echo "❌ Backend is not reachable at $API"
  echo "   Start it first: cd backend && npm run start:dev"
  exit 1
fi

echo "✅ Backend is reachable"
echo ""

ingest() {
  local name="$1"
  local source_type="$2"
  local content="$3"
  local metadata="$4"

  echo -n "  📄 $name ... "

  RESPONSE=$(curl -s -X POST "$API/ingestion/process" \
    -H "Content-Type: application/json" \
    -d "{\"content\": $(echo "$content" | jq -Rs .), \"source_type\": \"$source_type\", \"metadata\": $metadata}" 2>/dev/null)

  if echo "$RESPONSE" | jq -e '.success == true' > /dev/null 2>&1; then
    CHUNKS=$(echo "$RESPONSE" | jq -r '.chunk_count')
    echo "✅ ($CHUNKS chunks)"
  else
    echo "❌ FAILED"
    echo "     $RESPONSE"
  fi
}

# ═══════════════════════════════════════════════════════
# 1. PDF-STYLE DOCUMENTS (formal knowledge)
# ═══════════════════════════════════════════════════════
echo "📚 Ingesting PDF-style documents..."
echo ""

ingest "Engineering Handbook" "pdf" \
'# Engineering Handbook — TechNova Solutions

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
- Breaking changes must be documented in CHANGELOG.md' \
'{"fileName": "engineering_handbook.pdf", "department": "engineering", "category": "handbook"}'

ingest "Product Requirements Document (PRD)" "pdf" \
'# Product Requirements Document (PRD) — TechNova Solutions

## Feature: Real-time Notifications

Users should receive real-time updates when:
- A task is assigned to them
- A comment is added to their task
- Task status is changed
- A milestone is approaching (3 days before)
- A team member mentions them in a comment

### Technical Requirements
- WebSocket connection via Socket.io
- Fallback to SSE for restricted networks
- Push notification integration (Firebase Cloud Messaging)
- Notification preferences per user
- Mark as read / unread functionality
- Notification history (30 days retention)

## Feature: AI Knowledge Assistant

The AI assistant should:
- Answer internal engineering questions using company knowledge base
- Retrieve knowledge from uploaded documents (PDF, Markdown)
- Analyze and summarize GitHub commits and PRs
- Summarize Slack discussions by topic
- Assist onboarding engineers with company-specific information
- Provide source citations for every answer

### Performance Requirements
- API response time < 300ms for non-AI endpoints
- AI response latency < 3 seconds (time to first token)
- WebSocket latency < 100ms
- System uptime: 99.9%

## Feature: Advanced Analytics Dashboard

Real-time analytics for project managers:
- Sprint velocity tracking
- Burndown charts
- Team workload distribution
- Cycle time analytics
- Custom KPI dashboards

### Technical Requirements
- Data aggregation via materialized views
- Refresh every 5 minutes
- Export to CSV/PDF
- Role-based access control' \
'{"fileName": "product_requirements.pdf", "department": "product", "category": "prd"}'

# COMMENTED OUT — will be tested as real PDF uploads via the UI
# ingest "Security Policy" "pdf" \
# '# Security Policy — TechNova Solutions
#
# ## Authentication Rules
# - JWT must be verified on every request using RS256 algorithm
# - Access tokens expire after 15 minutes
# - Refresh tokens expire after 7 days
# - Token refresh must happen before expiry
# - Concurrent session limit: 3 devices per user
#
# ## Password Policy
# - Minimum 8 characters
# - Must include uppercase letter and number
# - Special characters recommended
# - Password history: last 5 passwords cannot be reused
# - Account lockout after 5 failed attempts (30 min lock)
#
# ## API Security
# - Rate limiting: 100 requests per minute per IP
# - IP blocking after 5 failed authentication attempts
# - All endpoints require HTTPS
# - CORS configured for allowed origins only
# - Input validation on all endpoints (DTO validation)
# - SQL injection prevention via parameterized queries
#
# ## Data Protection
# - PII data encrypted at rest (AES-256)
# - TLS 1.3 for data in transit
# - Database backups every 6 hours
# - Retention period: 7 years for financial data, 3 years for logs
#
# ## Incident Handling
# - All security incidents must be reported within 24 hours
# - Incident response team: security@technova.io
# - Severity levels: P1 (critical), P2 (high), P3 (medium), P4 (low)
# - P1 incidents: all hands on deck, CEO notified
# - Post-incident review required within 48 hours
#
# ## Compliance
# - SOC 2 Type II certified
# - GDPR compliant for EU users
# - Annual penetration testing
# - Quarterly security audits' \
# '{"fileName": "security_policy.pdf", "department": "security", "category": "policy"}'

# COMMENTED OUT — will be tested as real PDF uploads via the UI
# ingest "Onboarding Guide - Backend Engineer" "pdf" \
# '# Onboarding Guide — Backend Engineer — TechNova Solutions
#
# ## Welcome to TechNova!
# This guide will help you through your first week as a backend engineer.
#
# ### Day 1: Environment Setup
# 1. Clone the main repository: github.com/technova/platform
# 2. Install Node.js 20+ and Docker Desktop
# 3. Copy .env.example to .env and fill in credentials (ask your buddy)
# 4. Run: npm install && npm run start:dev
# 5. Verify the API is running at http://localhost:3000
#
# ### Day 2: Architecture Deep Dive
# - Review the system architecture diagram in /docs/architecture.md
# - Understand the module structure: infrastructure/ and modules/
# - Read the RAG pipeline documentation
# - Set up Supabase local instance for development
#
# ### Day 3: First Task
# - Pick a "good first issue" from the GitHub backlog
# - Create a feature branch: feature/your-name/issue-description
# - Write code + tests
# - Submit PR with description linking the issue
#
# ### Day 4: Codebase Walkthrough
# - Your buddy will walk you through key modules
# - Focus on: authentication, ingestion pipeline, chat service
# - Understand how the RAG pipeline works end-to-end
#
# ### Day 5: Shadowing & Review
# - Shadow a senior engineer during code review
# - Attend sprint planning meeting
# - Review 2-3 PRs from teammates
# - Set goals for week 2 with your manager
#
# ### Key Contacts
# - Engineering Lead: Alice Chen (@alice)
# - DevOps: Bob Martinez (@bob)
# - Security: Charlie Kim (@charlie)
# - Product: Emma Wilson (@emma)
# - Your Onboarding Buddy: Assigned by manager on Day 1
#
# ### Useful Links
# - Wiki: wiki.technova.io
# - GitHub: github.com/technova
# - Slack: technova.slack.com
# - Monitoring: grafana.technova.io' \
# '{"fileName": "onboarding_guide_backend.pdf", "department": "engineering", "category": "onboarding"}'

echo ""

# ═══════════════════════════════════════════════════════
# 2. MARKDOWN DOCUMENTS (developer knowledge)
# ═══════════════════════════════════════════════════════
echo "📝 Ingesting Markdown documents..."
echo ""

ingest "System Architecture" "markdown" \
'# System Architecture — TechNova Solutions

## Overview
The system is built using a microservice-inspired modular monolith architecture. Each business domain is encapsulated in its own module with clear boundaries.

## Components

### API Layer (NestJS Controllers)
- RESTful endpoints for document management and chat
- WebSocket Gateway for real-time AI response streaming
- Global validation pipes and exception filters

### Service Layer
- Business logic separated from controllers
- Modular structure: each feature is a self-contained module
- Dependency injection via NestJS DI container

### Repository Layer
- Supabase client for PostgreSQL access
- pgvector extension for vector similarity search
- HNSW indexing for fast retrieval

### AI Layer (LangChain + RAG)
- Query rewriting for better retrieval
- Text embedding using OpenAI text-embedding-3-small (1536 dimensions)
- Vector search with cosine similarity
- Context assembly with token budgeting
- LLM completion with source citations

## RAG Pipeline Flow
1. User submits a question
2. Query rewriter reformulates the question for better retrieval
3. Question is embedded into a 1536-dim vector
4. pgvector performs cosine similarity search (top-K chunks)
5. Retrieval validator scores confidence (high/medium/low)
6. Context builder assembles chunks within token budget
7. Prompt builder formats system prompt + context + question
8. LLM generates answer with citations
9. Citation service deduplicates and formats sources

## Token Budget Allocation
- System prompt: 300 tokens
- Conversation history: 800 tokens
- Retrieved context: 2500 tokens
- Total max: ~4000 tokens

## Realtime Layer
- WebSocket Gateway using Socket.io
- Used for streaming AI responses token by token
- Room-based channels per chat session
- Automatic reconnection handling' \
'{"fileName": "architecture.md", "department": "engineering", "category": "docs"}'

ingest "Backend Guidelines" "markdown" \
'# Backend Guidelines — TechNova Solutions

## Module Structure Rules
- Use DTOs for all input validation
- Separate controller / service / repository layers
- Never access the database directly from a controller
- Each module should be self-contained with its own imports

## DTOs
- All DTOs must use class-validator decorators
- Use class-transformer for response serialization
- Document all fields with @ApiProperty for Swagger

## Error Handling
- Use NestJS global exception filter
- Return consistent error format:
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
  }
- Log all errors with structured logging (JSON)
- Never expose stack traces in production

## Logging
- Use structured logging (JSON format)
- Log levels: error, warn, info, debug
- Include requestId in all log entries
- Log all critical operations (auth, data mutations)
- Use correlation IDs for distributed tracing

## Testing
- Unit tests for all services (Jest)
- Integration tests for API endpoints (Supertest)
- Minimum 80% code coverage
- Test files co-located: service.spec.ts next to service.ts
- Use describe/it blocks with clear test descriptions

## Git Conventions
- Branch naming: feature/name, fix/name, refactor/name
- Commit format: type(scope): description
- Types: feat, fix, refactor, docs, test, chore
- PRs require 2 approvals and passing CI

## Database
- Use migrations for all schema changes
- Never modify schema manually in production
- Use parameterized queries (no string interpolation)
- Index frequently queried columns
- Use JSONB for flexible metadata storage' \
'{"fileName": "backend-guidelines.md", "department": "engineering", "category": "docs"}'

ingest "API Reference" "markdown" \
'# API Reference — TechNova Solutions

## Base URL
- Production: https://api.technova.io
- Staging: https://api-staging.technova.io
- Development: http://localhost:3000

## Authentication
All endpoints except /auth/login and /auth/register require a valid JWT token in the Authorization header.

Authorization: Bearer <access_token>

## Endpoints

### POST /auth/login
Login with email and password. Returns access and refresh tokens.

### POST /auth/refresh
Refresh access token using a valid refresh token.

### GET /documents
List all documents. Supports pagination with ?page=1&limit=20.

### POST /documents
Create a new document with content and metadata.

### POST /ingestion/process
Ingest content through the RAG pipeline. Automatically:
1. Creates document record
2. Cleans and normalizes text
3. Splits into chunks (500 chars, 80 overlap)
4. Generates embeddings (OpenAI text-embedding-3-small)
5. Stores chunks with vectors in Supabase

### POST /chat
Send a message and receive an AI-generated answer with source citations.
Supports session continuity via session_id parameter.

### GET /chat/sessions
List recent chat sessions for the current user.

### GET /health
Health check endpoint. Returns status of API, database, and AI services.' \
'{"fileName": "api-reference.md", "department": "engineering", "category": "docs"}'

ingest "Database Schema" "markdown" \
'# Database Schema — TechNova Solutions

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| role | VARCHAR(50) | admin, engineer, manager, viewer |
| created_at | TIMESTAMPTZ | Account creation date |
| updated_at | TIMESTAMPTZ | Last profile update |

### documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | Original document content |
| source_type | VARCHAR(50) | pdf, markdown, slack, github |
| metadata | JSONB | Arbitrary metadata (fileName, department, etc.) |
| created_at | TIMESTAMPTZ | Ingestion timestamp |

### document_chunks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key to documents |
| content | TEXT | Chunk text (max ~500 chars) |
| embedding | VECTOR(1536) | OpenAI text-embedding-3-small |
| metadata | JSONB | Chunk-level metadata |
| chunk_index | INTEGER | Position in original document |
| created_at | TIMESTAMPTZ | Creation timestamp |

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| title | TEXT | Auto-generated from first message |
| metadata | JSONB | Session metadata |
| created_at | TIMESTAMPTZ | Session start |
| updated_at | TIMESTAMPTZ | Last activity |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to chat_sessions |
| role | VARCHAR(20) | system, user, assistant, tool |
| content | TEXT | Message text |
| sources | JSONB | Citation data |
| metadata | JSONB | Pipeline metrics |
| tokens_used | INTEGER | Token count |
| created_at | TIMESTAMPTZ | Message timestamp |

## Indexes
- document_chunks: HNSW index on embedding column for fast cosine similarity
- messages: B-tree index on session_id for fast conversation retrieval
- documents: B-tree index on source_type for filtering' \
'{"fileName": "database-schema.md", "department": "engineering", "category": "docs"}'

echo ""

# ═══════════════════════════════════════════════════════
# 3. SLACK CHAT LOGS (simulated conversations)
# ═══════════════════════════════════════════════════════
echo "💬 Ingesting Slack chat logs..."
echo ""

ingest "Backend Team Chat" "slack" \
'Backend Team Discussion — #backend-team Slack Channel

[2025-01-10 09:15] alice: Hey team, JWT expiration is causing issues in the mobile app. Users are getting logged out mid-session.

[2025-01-10 09:22] bob: I noticed that too. The 15-minute access token expiry is too aggressive for mobile. We should increase the refresh token duration.

[2025-01-10 09:30] charlie: Agreed. Let us extend refresh token duration to 14 days instead of 7 days. That should fix the mobile experience.

[2025-01-10 09:45] alice: Also, the refresh mechanism itself has a race condition. If two API calls happen simultaneously when the token is about to expire, both try to refresh and one fails.

[2025-01-10 10:00] bob: We can fix that with a mutex/lock on the refresh flow. I have seen this pattern before. Only one refresh request at a time, others wait.

[2025-01-10 10:15] charlie: I will create a ticket for the mutex fix. Priority P2 since it affects power users with many tabs open.

[2025-01-11 14:00] john: Hey, I fixed the JWT expiration bug yesterday. The refresh token duration is now 14 days as discussed. PR #847 is ready for review.

[2025-01-11 14:15] alice: Thanks John! I will review it today.

[2025-01-11 16:30] alice: PR #847 looks good. Approved and merged. Deploying to staging.

[2025-01-15 11:00] charlie: The RAG pipeline retrieval accuracy has dropped 15% since last week. I think it is because we added too many documents without proper chunking.

[2025-01-15 11:15] alice: Can you check the chunk overlap settings? We might need to increase from 80 to 120 characters.

[2025-01-15 11:30] charlie: Good idea. I will run some benchmarks with different overlap values and share results.

[2025-01-20 09:00] bob: Heads up, I am migrating the database connection pool configuration. Pool size is going from 10 to 30 connections.

[2025-01-20 09:05] alice: Why the increase? Are we hitting limits?

[2025-01-20 09:10] bob: Yes, we hit pool exhaustion last Friday during peak hours. The API was sluggish for about 15 minutes. Increasing pool size should prevent that.' \
'{"fileName": "backend-team.json", "channel": "#backend-team", "source": "slack"}'

ingest "Product Team Chat" "slack" \
'Product Team Discussion — #product-team Slack Channel

[2025-01-12 10:00] emma: Users are requesting better notifications. The current email-only approach is too slow for time-sensitive updates.

[2025-01-12 10:05] liam: We should implement real-time updates using WebSockets. I have drafted a PRD for the notification system.

[2025-01-12 10:15] emma: Great! Can you also include push notification support for mobile? That is the most requested feature in our feedback portal.

[2025-01-12 10:20] liam: Yes, Firebase Cloud Messaging is in the PRD. We will support both WebSocket (web) and FCM (mobile).

[2025-01-12 11:00] sophia: From analytics perspective, notification engagement could be a great KPI. We should track open rates and click-through rates.

[2025-01-12 11:15] emma: Good idea. Let us add notification analytics to the dashboard.

[2025-01-18 14:00] emma: Roadmap update for Q1: AI Assistant MVP and Real-time notifications are our top priorities. Analytics dashboard is pushed to Q2.

[2025-01-18 14:10] liam: The AI assistant is already in development. Charlie has the RAG pipeline working. We need to integrate it with the frontend.

[2025-01-18 14:20] emma: Perfect. Let us target end of January for the AI assistant beta release.

[2025-01-25 09:00] sophia: Latest KPI report: User engagement is up 23% since we launched the notification beta. Retention improved by 8%.

[2025-01-25 09:15] emma: Excellent numbers! Let us present this at the all-hands meeting on Friday.' \
'{"fileName": "product-team.json", "channel": "#product-team", "source": "slack"}'

echo ""

# ═══════════════════════════════════════════════════════
# 4. GITHUB DATA (simulated commits)
# ═══════════════════════════════════════════════════════
echo "🧠 Ingesting GitHub data..."
echo ""

ingest "GitHub Commit History" "github" \
'GitHub Repository: technova/platform — Recent Commits

commit a1b2c3d — 2025-01-11
Author: john (@john)
Message: Fix JWT refresh token expiration bug
Files changed: src/auth/auth.service.ts, src/auth/auth.module.ts
Description: Extended refresh token duration from 7 days to 14 days. Added mutex lock on refresh flow to prevent race conditions when multiple simultaneous refresh requests occur.
PR: #847

commit d4e5f6g — 2025-01-12
Author: alice (@alice)
Message: Add WebSocket support for real-time notifications
Files changed: src/gateway/notification.gateway.ts, src/gateway/notification.module.ts
Description: Implemented Socket.io WebSocket gateway for real-time notification delivery. Supports room-based channels, automatic reconnection, and fallback to SSE.

commit g7h8i9k — 2025-01-15
Author: charlie (@charlie)
Message: Improve RAG retrieval accuracy with better chunking
Files changed: src/rag/chunking/text-chunker.ts
Description: Increased chunk overlap from 80 to 120 characters. Improved boundary detection to avoid splitting mid-sentence. Benchmarks show 12% improvement in retrieval accuracy.

commit l2m3n4o — 2025-01-18
Author: bob (@bob)
Message: Increase database connection pool size
Files changed: src/infrastructure/database/database.config.ts
Description: Increased pool size from 10 to 30 connections. Added connection monitoring and alerting when pool utilization exceeds 80%.

commit p5q6r7s — 2025-01-20
Author: alice (@alice)
Message: Implement notification preferences API
Files changed: src/notifications/notifications.controller.ts, src/notifications/notifications.service.ts
Description: Added CRUD endpoints for user notification preferences. Supports per-channel (email, push, websocket) and per-type (task, comment, mention) preferences.

commit t8u9v0w — 2025-01-22
Author: john (@john)
Message: Add rate limiting middleware
Files changed: src/middleware/rate-limiter.middleware.ts
Description: Implemented IP-based rate limiting using sliding window algorithm. Default: 100 requests per minute per IP. Configurable per endpoint.

commit x1y2z3a — 2025-01-25
Author: charlie (@charlie)
Message: Add RAG evaluation pipeline
Files changed: src/rag/evaluation/evaluation.service.ts
Description: Added automated RAG evaluation with test question set. Measures retrieval accuracy, response quality, and latency. Runs nightly via cron job.' \
'{"fileName": "commits.json", "repository": "technova/platform", "source": "github"}'

echo ""

# ═══════════════════════════════════════════════════════
# 5. INCIDENT REPORTS
# ═══════════════════════════════════════════════════════
echo "🚨 Ingesting incident reports..."
echo ""

ingest "Incident Report — API Downtime" "markdown" \
'# Incident Report — API Downtime

**Date:** 2025-02-01
**Severity:** P1 (Critical)
**Duration:** 45 minutes (14:00 — 14:45 UTC)
**Incident Commander:** Bob Martinez

## Timeline
- 14:00 — Alert triggered: API response time exceeded 5 seconds
- 14:05 — Multiple users reported 503 errors
- 14:10 — Investigation started. Database connections were piling up.
- 14:15 — Root cause identified: Database connection pool exhausted
- 14:20 — Emergency fix: Restarted application servers to reset connections
- 14:30 — Connection pool size increased from 10 to 30
- 14:35 — Added connection monitoring and alerting
- 14:45 — Full service restored. All endpoints responding normally.

## Root Cause
The database connection pool was set to 10 connections. During peak hours, the application needed more than 10 concurrent connections, causing new requests to queue and eventually timeout.

## Fix Applied
- Increased pool size from 10 to 30 connections
- Added connection pool monitoring dashboard in Grafana
- Configured alerting when pool utilization exceeds 80%
- Added connection timeout: 5 seconds max wait for available connection

## Prevention
- Load testing before deployment to validate pool sizing
- Auto-scaling rules for connection pool based on traffic patterns
- Regular review of database connection metrics
- Improved load testing to simulate peak traffic scenarios

## Lessons Learned
- Connection pool sizing should be based on load testing, not estimates
- Monitoring should include connection pool utilization metrics
- Need faster incident response process for P1 incidents' \
'{"fileName": "incident-api-downtime.md", "type": "incident", "severity": "P1"}'

ingest "Incident Report — Data Migration Failure" "markdown" \
'# Incident Report — Data Migration Failure

**Date:** 2025-01-28
**Severity:** P2 (High)
**Duration:** 2 hours (10:00 — 12:00 UTC)
**Incident Commander:** Alice Chen

## Timeline
- 10:00 — Scheduled migration started: adding chunk_index column to document_chunks
- 10:15 — Migration failed: column already existed in some environments
- 10:30 — Rollback initiated
- 10:45 — Rollback completed, service restored
- 11:00 — Root cause: migration was partially applied in staging
- 11:30 — Fix: Added IF NOT EXISTS clause to migration
- 12:00 — Migration re-run successfully

## Root Cause
The migration script did not account for partial application in the staging environment. The chunk_index column was already added manually during development but the migration script did not check for existence.

## Fix Applied
- Added IF NOT EXISTS clause to all ALTER TABLE statements
- Added pre-migration validation script
- Updated migration documentation with checklist

## Lessons Learned
- Always use IF NOT EXISTS in migration scripts
- Test migrations against a copy of production data
- Never manually modify database schema outside of migrations' \
'{"fileName": "incident-migration-failure.md", "type": "incident", "severity": "P2"}'

echo ""

# ═══════════════════════════════════════════════════════
# 6. PRODUCT / BUSINESS DOCUMENTS
# ═══════════════════════════════════════════════════════
echo "📊 Ingesting business documents..."
echo ""

ingest "Product Roadmap" "markdown" \
'# Product Roadmap — TechNova Solutions

## Q1 2025
- AI Knowledge Assistant MVP
  - Document ingestion (PDF, Markdown)
  - RAG pipeline with vector search
  - Chat interface with source citations
- Real-time Notifications
  - WebSocket infrastructure
  - Push notifications (Firebase)
  - Notification preferences

## Q2 2025
- Advanced Analytics Dashboard
  - Sprint velocity tracking
  - Burndown charts
  - Team workload distribution
  - Custom KPI dashboards
- Multi-language Support
  - i18n framework integration
  - Turkish, German, Japanese translations
  - RTL layout support

## Q3 2025
- AI-powered Recommendations
  - Task assignment suggestions
  - Sprint planning assistance
  - Risk detection
- Mobile App (React Native)
  - iOS and Android
  - Offline mode
  - Biometric authentication

## Q4 2025
- Enterprise Features
  - SSO / SAML integration
  - Audit logging
  - Custom workflows
  - Advanced permissions

## KPI Targets
- User engagement: +30% by Q2
- Retention rate: 85% monthly
- NPS score: > 50
- API response time: < 300ms p99' \
'{"fileName": "roadmap.md", "department": "product", "category": "roadmap"}'

ingest "KPI Report — January 2025" "markdown" \
'# KPI Report — January 2025 — TechNova Solutions

## User Metrics
- Monthly Active Users (MAU): 12,450 (+18% MoM)
- Daily Active Users (DAU): 3,200 (+15% MoM)
- New Signups: 890 (+22% MoM)
- Retention (30-day): 82% (+3% MoM)

## Engagement
- Average Session Duration: 8.5 minutes (+1.2 min)
- Tasks Created per User: 12.3 (+2.1)
- AI Assistant Queries: 2,450 (new feature)
- Notification Engagement Rate: 67% (new metric)

## Performance
- API Response Time (p50): 120ms
- API Response Time (p99): 280ms
- WebSocket Latency (p50): 45ms
- System Uptime: 99.95%
- Error Rate: 0.03%

## Revenue
- MRR: $124,500 (+12% MoM)
- Churn Rate: 2.1% (-0.3% MoM)
- ARPU: $10.00 (+$0.50)
- Net Revenue Retention: 115%

## Engineering
- Deployment Frequency: 3.2 per day
- Mean Time to Recovery: 12 minutes
- Change Failure Rate: 2.5%
- Test Coverage: 84%
- Open P1 Bugs: 1
- Open P2 Bugs: 7' \
'{"fileName": "kpi-report-january-2025.md", "department": "product", "category": "kpi"}'

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ Test data seeding complete!"
echo ""
echo "📊 Summary of ingested documents:"
echo "   - 4 PDF documents (Engineering Handbook, PRD, Security Policy, Onboarding Guide)"
echo "   - 4 Markdown files (Architecture, Guidelines, API Reference, DB Schema)"
echo "   - 2 Slack channel logs (Backend Team, Product Team)"
echo "   - 1 GitHub commit history"
echo "   - 2 Incident reports (API Downtime, Migration Failure)"
echo "   - 2 Business documents (Roadmap, KPI Report)"
echo ""
echo "🧪 Test Questions to Try:"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  Engineering:"
echo "    → 'How does authentication work?'"
echo "    → 'What is the deployment process?'"
echo "    → 'What are the coding standards?'"
echo ""
echo "  Context + Slack:"
echo "    → 'Why did we change JWT expiration?'"
echo "    → 'What did the backend team discuss about tokens?'"
echo "    → 'What was discussed about real-time notifications?'"
echo ""
echo "  Incidents:"
echo "    → 'Why did the API go down?'"
echo "    → 'What caused the data migration failure?'"
echo ""
echo "  GitHub:"
echo "    → 'Who worked on the WebSocket feature?'"
echo "    → 'What changes did Charlie make?'"
echo ""
echo "  Product:"
echo "    → 'What features are planned in the roadmap?'"
echo "    → 'What are the KPI targets?'"
echo ""
echo "  Onboarding:"
echo "    → 'What should a new backend engineer do on day 1?'"
echo "    → 'Who is the engineering lead?'"
echo ""
echo "═══════════════════════════════════════════════════════"
