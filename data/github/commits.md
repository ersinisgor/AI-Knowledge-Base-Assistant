# GitHub Commit History — TechNova Solutions

Repository: technova/platform | Branch: main | Exported: 2025-01-20

---

## January 2025

| Hash | Date | Author | Message |
|------|------|--------|---------|
| a1b2c3 | 2025-01-11 | john | Fix JWT expiration bug — extend refresh token duration to 14 days |
| d4e5f6 | 2025-01-12 | alice | Add WebSocket support for real-time task notifications |
| g7h8i9 | 2025-01-15 | charlie | Improve RAG retrieval accuracy — tune cosine similarity threshold |
| j1k2l3 | 2025-01-15 | charlie | Add token budget management to context builder |
| m4n5o6 | 2025-01-16 | bob | Enable refresh token rotation on every use |
| p7q8r9 | 2025-01-17 | alice | Add Socket.io rooms for per-user notification delivery |
| s1t2u3 | 2025-01-18 | john | Fix CORS issue with mobile WebView and HttpOnly cookie |
| v4w5x6 | 2025-01-19 | dave | Increase database connection pool size from 10 to 20 |
| y7z8a9 | 2025-01-20 | charlie | Add query rewriting step to RAG pipeline |

---

## Commit Details

### a1b2c3 — Fix JWT expiration bug
Author: john | Date: 2025-01-11
- Extended refresh token expiry from 7 days to 14 days
- Fixed silent refresh logic failing in mobile WebView
- Files changed: `auth.service.ts`, `jwt.config.ts`

### d4e5f6 — Add WebSocket support for real-time task notifications
Author: alice | Date: 2025-01-12
- Integrated Socket.io gateway with task service
- Emit events on: task assigned, comment added, status changed
- Files changed: `notifications.gateway.ts`, `tasks.service.ts`, `notifications.module.ts`

### g7h8i9 — Improve RAG retrieval accuracy
Author: charlie | Date: 2025-01-15
- Raised cosine similarity threshold for HIGH confidence from 0.80 to 0.85
- Increased minimum chunk count requirement for HIGH confidence to 3
- Files changed: `retrieval-validator.service.ts`

### j1k2l3 — Add token budget management to context builder
Author: charlie | Date: 2025-01-15
- Enforces hard token limits per context section (system: 300, history: 800, chunks: 2500)
- Prevents context overflow that degraded answer quality silently
- Files changed: `context-builder.service.ts`

### m4n5o6 — Enable refresh token rotation
Author: bob | Date: 2025-01-16
- Refresh tokens are now invalidated after each use
- Reuse of an old refresh token immediately terminates the session
- Files changed: `auth.service.ts`, `tokens.repository.ts`

### v4w5x6 — Increase database connection pool size
Author: dave | Date: 2025-01-19
- Increased pool size from 10 to 20 to handle peak traffic
- Added Datadog alert for pool utilization > 80%
- Files changed: `database.config.ts`

### y7z8a9 — Add query rewriting step to RAG pipeline
Author: charlie | Date: 2025-01-20
- New `QueryRewriterService` resolves pronouns and ambiguous references before embedding
- Uses GPT-4o-mini at temperature=0.2 for consistent rewrites
- Falls back to original query if rewrite call fails
- Files changed: `rag-pipeline.service.ts`, `query-rewriter.service.ts`
