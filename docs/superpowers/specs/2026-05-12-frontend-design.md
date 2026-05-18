---
name: Frontend Design Spec
description: Full-stack restructuring and Next.js frontend for the AI Knowledge Base Assistant
type: project
---

# Frontend Design Spec — AI Knowledge Base Assistant

## Overview

Restructure the project into a monorepo with `backend/` (existing NestJS) and `frontend/` (new Next.js). Build a production-grade enterprise AI operations platform with dark theme, streaming chat, retrieval pipeline transparency, and system-level metrics.

## Project Structure

```
AI-Knowledge-Base-Assistant/
├── backend/                    ← existing NestJS code moved here
│   ├── src/
│   ├── test/
│   ├── nest-cli.json
│   ├── tsconfig.json
│   ├── tsconfig.build.json
│   ├── package.json
│   └── .env
├── frontend/                   ← new Next.js 15 app
│   ├── app/
│   │   ├── layout.tsx          # Root layout with sidebar
│   │   ├── page.tsx            # Chat (default landing page)
│   │   ├── documents/
│   │   │   └── page.tsx        # Documents + ingestion lifecycle
│   │   ├── dashboard/
│   │   │   └── page.tsx        # AI operations metrics
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts    # Proxy: POST /chat (streaming)
│   │       ├── documents/
│   │       │   └── route.ts    # Proxy: GET/POST /documents
│   │       ├── ingestion/
│   │       │   └── route.ts    # Proxy: POST /ingestion/process
│   │       └── sessions/
│   │           └── route.ts    # Proxy: GET /chat/sessions
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx     # Navigation sidebar with session list
│   │   │   └── header.tsx      # Top bar
│   │   ├── chat/
│   │   │   ├── chat-area.tsx   # Main chat message area
│   │   │   ├── chat-input.tsx  # Input bar with send
│   │   │   ├── chat-message.tsx# Single message (user/assistant)
│   │   │   ├── streaming-indicator.tsx  # Typing cursor + stop button
│   │   │   ├── retrieval-status.tsx     # Pipeline status indicators
│   │   │   ├── query-transformation.tsx # Original → expanded query
│   │   │   ├── confidence-warning.tsx   # Low confidence / conflict banners
│   │   │   └── model-badge.tsx          # "GPT-4.1-mini · 1.2s · 284 tokens"
│   │   ├── sources/
│   │   │   ├── sources-panel.tsx     # Collapsible right panel
│   │   │   ├── source-card.tsx       # Individual source with highlight
│   │   │   ├── source-preview.tsx    # Full drawer/modal for source
│   │   │   └── retrieval-config.tsx  # Strategy metadata box
│   │   ├── documents/
│   │   │   ├── upload-zone.tsx       # Drag & drop upload area
│   │   │   ├── document-list.tsx     # Table with ingestion progress
│   │   │   └── ingestion-progress.tsx# 5-stage progress bar
│   │   └── dashboard/
│   │       ├── stat-card.tsx         # Metric card with trend
│   │       ├── latency-chart.tsx     # SVG/recharts line chart
│   │       ├── pipeline-stats.tsx    # Ingestion pipeline metrics
│   │       ├── system-config.tsx     # LLM/embedding/DB config display
│   │       └── activity-feed.tsx     # Recent activity log
│   ├── lib/
│   │   ├── api.ts              # Typed API client for backend proxy
│   │   ├── types.ts            # Shared TypeScript interfaces
│   │   └── utils.ts            # Formatting helpers
│   ├── hooks/
│   │   ├── use-chat.ts         # Chat state + streaming
│   │   ├── use-documents.ts    # Document list + upload
│   │   └── use-sessions.ts     # Session management
│   ├── package.json
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── components.json         # shadcn/ui config
├── .gitignore
└── README.md
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Components | shadcn/ui + Radix primitives |
| Styling | Tailwind CSS v4, dark theme |
| Icons | Lucide React |
| Charts | Recharts |
| State | React hooks (no external state lib) |
| Backend Proxy | Next.js API route handlers |
| Backend | Existing NestJS on port 3000 |

## Pages

### 1. Chat (Default Landing Page)

Three-column layout: sidebar (220px) | chat area (flex) | sources panel (290px, collapsible).

**Sidebar:**
- Logo + app name with Lucide icons
- "New Chat" button
- Recent sessions list (clickable, persists via backend chat_sessions)
- Bottom navigation: Chat, Documents, Dashboard (active state highlighted with cyan)

**Chat Area:**
- Top bar: session title + toggle for sources panel
- Messages: enterprise-style, no bubble styling. User messages right-aligned with dark bg. AI messages left-aligned with icon, inline citation links `[1]` `[2]`
- Each AI response shows: model badge (`GPT-4.1-mini · 1.2s · 284 tokens`), clickable citation pills, confidence info
- Retrieval status indicators before AI response:
  - "Searching indexed knowledge base..." with spinner
  - "Retrieved 5 relevant sources" with checkmark
  - "High confidence retrieval (92%)" with checkmark
- Query transformation box: shows original query → expanded semantic query
- Failure/warning states:
  - Low confidence banner (amber): "Low confidence answer — partial context only"
  - Source conflict detection: "2 of 3 retrieved sources conflict on cancellation terms"
  - "No highly relevant documents found" for empty retrieval
- Streaming: blinking cursor on partial response, "Stop generating" button with X icon
- Input bar: placeholder text, send button with arrow icon

**Sources Panel (right side, collapsible):**
- Header: "Sources" + count badge
- Retrieval Configuration box showing:
  - Strategy: Hybrid (BM25 + Vector)
  - Embedding: text-embedding-3-small
  - Vector DB: pgvector (HNSW)
  - Reranker: Cohere Rerank v3
- Source cards with:
  - File icon (color-coded by type: cyan for md, amber for pdf)
  - Filename
  - Similarity score badge (green for high, amber for medium)
  - Highlighted matching snippet
  - Metadata: chunk index, source type, timestamp
  - Conflict flag when sources disagree
- Clicking a source opens the Source Preview Drawer

**Source Preview Drawer:**
- Slides over chat content (sheet/drawer from shadcn)
- Shows: filename, metadata badges (type, chunk position, similarity %)
- Full chunk text with highlighted matching portions
- "Show surrounding context" expandable toggle
- Footer: upload timestamp + "View full document" link

### 2. Documents Page

**Upload Zone:**
- Drag-and-drop area with dashed border
- Upload icon + "Drop files here or click to upload"
- Supported formats: PDF, Markdown, Text, max 10MB

**Document Table:**
- Columns: Document (icon + name), Ingestion Progress, Status, Chunks, Uploaded
- Ingestion progress: 5-segment bar showing lifecycle stages:
  1. Uploaded (green)
  2. Parsing (green)
  3. Chunking (green)
  4. Embedding (pulsing amber when active)
  5. Indexed (green)
- Status badges:
  - Indexed: green badge
  - Embedding: amber badge, pulsing
  - Failed: red badge
- Legend below table showing all lifecycle stages

### 3. Dashboard Page

**Top Row — 4 Metric Cards:**
1. Retrieval Latency: `340ms` with trend (↓ 12% vs last week)
2. Token Usage: `12.4k` with trend
3. Retrieval Success Rate: `94%` with trend
4. Avg Confidence: `87%` with trend

**Middle Row:**
- Left (2/3 width): Retrieval Latency line chart (7 days)
  - SVG line chart with area gradient fill
  - Target line (dashed)
  - X-axis: days of week, Y-axis: latency in ms
  - Built with Recharts
- Right (1/3 width): Ingestion Pipeline stats
  - Documents processed, total chunks, pipeline failures, avg processing time
  - System Config section: LLM model, embedding model, vector DB

## API Integration

Frontend API routes proxy all requests to the NestJS backend (`localhost:3000`). The backend API is not exposed directly to the browser.

| Frontend Route | Backend Endpoint | Method |
|---------------|-----------------|--------|
| `/api/chat` | `/chat` | POST (streaming SSE) |
| `/api/documents` | `/documents` | GET, POST |
| `/api/ingestion` | `/ingestion/process` | POST |
| `/api/sessions` | `/chat/sessions` | GET |

**Streaming:** The chat API route proxies the backend response as a streaming Server-Sent Events (SSE) response. The backend may need a streaming endpoint added, or the frontend proxy streams the complete response with simulated token-by-token rendering.

## Data Flow

### Chat Flow
1. User types message → `use-chat` hook sends POST to `/api/chat`
2. Frontend shows retrieval status indicators (Searching → Retrieved → Confidence)
3. Response streams back token-by-token with blinking cursor
4. On completion: model badge appears, sources panel populates
5. Session ID saved for continuity

### Document Upload Flow
1. User drops file → read as text client-side
2. POST to `/api/ingestion` with content + metadata
3. Document appears in list immediately with "Parsing" status
4. Poll for status updates (or optimistic UI with lifecycle progression)
5. Progress bar advances through 5 stages

### Dashboard Flow
1. On page load, fetch documents and sessions from API
2. Compute metrics client-side from document/session data
3. Latency chart uses historical data from chat sessions (tokens_used, created_at)
4. Poll periodically or refresh on navigation

## Design Tokens

| Token | Value |
|-------|-------|
| Background (main) | `#0f172a` |
| Background (sidebar/panels) | `#1e293b` |
| Background (cards/inputs) | `#1e293b` with `#334155` border |
| Primary accent | `#22d3ee` (cyan) |
| Success | `#34d399` (green) |
| Warning | `#fbbf24` (amber) |
| Error | `#f87171` (red) |
| Text primary | `#f1f5f9` |
| Text secondary | `#94a3b8` |
| Text muted | `#64748b` |
| Border | `#334155` |
| Border radius (cards) | `8px` |
| Border radius (inputs) | `10px` |

## Key Implementation Notes

1. **Backend restructuring:** Move all files (except .gitignore, README.md, docs/) into `backend/` folder. Update `nest-cli.json` and `tsconfig.json` paths if needed. Backend runs independently on port 3000.

2. **Branch strategy:** Create `feature/frontend` branch from current `feature/rag-pipeline` branch. All frontend work happens there with frequent commits.

3. **shadcn/ui setup:** Initialize with `npx shadcn@latest init` using dark theme, then add components as needed: button, input, card, badge, sheet (for drawer), separator, scroll-area, skeleton.

4. **Streaming implementation:** Use the Fetch API with `ReadableStream` on the client. The Next.js API route handler streams the backend response chunk-bychunk. Client renders tokens incrementally.

5. **Ingestion lifecycle:** The backend currently processes synchronously (returns chunk_count on completion). For the progressive UI, either:
   - Add a status field to documents and poll for updates, or
   - Use optimistic UI that simulates the stages based on file size

6. **Query transformation visibility:** The backend's `query-rewriter.service.ts` already rewrites queries. Expose the rewritten query in the chat response DTO alongside the answer.

7. **Retrieval config display:** Hardcode the retrieval strategy metadata initially (read from env/config). Can be made dynamic later.

8. **Confidence/failure states:** The backend returns `retrieval_confidence` (high/medium/low). Map to UI states: high = green checkmark, medium = amber warning, low = red warning with banner.

## Backend Enhancements Needed

The following backend changes are needed to support the frontend features (these are small DTO additions, not architectural changes):

1. **Chat response DTO** — Add `rewritten_query: string` field to expose the query rewriter output
2. **Chat response DTO** — Add `retrieval_metadata` object with `strategy`, `latency_ms`, `sources_found` fields
3. **Chat response DTO** — Add `model: string` field indicating which LLM generated the response
4. **Documents response** — Add `status` field with values: `uploaded | parsing | chunking | embedding | indexed | failed`
5. **Sessions endpoint** — Add `GET /chat/sessions` endpoint to list sessions with titles and timestamps
6. **Streaming** — Consider adding SSE streaming support to the chat endpoint for real-time token delivery
