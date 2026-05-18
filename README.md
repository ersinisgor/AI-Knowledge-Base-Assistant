# AI Knowledge Base Assistant

> **Full-stack RAG platform** — document ingestion, vector search, and AI-powered Q&A with source attribution, built as a production-grade monorepo.

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-412991?style=flat-square&logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-3ECF8E?style=flat-square&logo=supabase&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-1.x-1C3C3C?style=flat-square)

---

## What This Project Does

Companies accumulate internal knowledge across PDFs, Markdown docs, Slack threads, and GitHub wikis — and most of it becomes inaccessible within weeks of being written. This platform solves that by turning any text document into a queryable knowledge base.

You upload a document. The system chunks it, generates vector embeddings, and stores them in a Postgres database with pgvector. When a user asks a question, the platform rewrites the query for better retrieval, performs cosine similarity search, validates the retrieval confidence, assembles a token-budgeted context window, and routes it through GPT-4o-mini — returning a grounded, source-cited answer.

This is **RAG (Retrieval-Augmented Generation)** implemented from the ground up, without relying on a managed chain library for the core pipeline logic.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Frontend  —  Next.js 16, App Router, TypeScript               │
│                                                                 │
│   /chat          /documents          /dashboard                 │
│   ↓ Chat UI      ↓ Upload + list     ↓ Metrics + activity      │
│                                                                 │
│   API Routes (/api/*)  ← proxy layer, keeps backend internal   │
└───────────────────────────────┬────────────────────────────────┘
                                │ HTTP
                                ▼
┌────────────────────────────────────────────────────────────────┐
│  Backend  —  NestJS 11, TypeScript strict mode                 │
│                                                                 │
│  POST /ingestion/upload    POST /chat    GET /documents          │
│  DELETE /documents/:id   POST /api/upload-pdf (Next.js proxy)  │
│                                                                 │
│  ┌──────────────────────┐  ┌─────────────────────────────────┐ │
│  │  Ingestion Pipeline  │  │        RAG Pipeline             │ │
│  │                      │  │                                 │ │
│  │  1. Store document   │  │  a. Query rewrite (LLM)        │ │
│  │  2. Clean text       │  │  b. Embed query (OpenAI)       │ │
│  │  3. Chunk (LangChain)│  │  c. Vector retrieve (pgvector) │ │
│  │  4. Embed (OpenAI)   │  │  d. Confidence validation      │ │
│  │  5. Store chunks     │  │  e. Token-budgeted context     │ │
│  └──────────────────────┘  │  f. LLM completion             │ │
│                             │  g. Citation formatting        │ │
│                             └─────────────────────────────────┘ │
│                                                                 │
│  Infrastructure Layer                                           │
│  LlmService · EmbeddingsService · SupabaseService              │
└───────────────────────────────┬────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────┐
│  Supabase  —  PostgreSQL + pgvector extension                  │
│                                                                 │
│  documents        document_chunks      chat_sessions  messages  │
│                   embedding vector(1536)                        │
│                   HNSW index (cosine)                          │
└────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

### Backend

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | NestJS 11 + TypeScript | Enforces modular architecture; DI container eliminates manual wiring |
| Database | Supabase (PostgreSQL) | Managed Postgres with pgvector built-in |
| Vector index | pgvector HNSW | Sub-linear ANN search; outperforms IVFFlat on recall at this scale |
| LLM | OpenAI GPT-4o-mini | Cost-efficient with strong instruction-following for citation-constrained prompts |
| Embeddings | text-embedding-3-small (1536-dim) | Best cost/performance ratio in OpenAI's current embedding lineup |
| Text splitting | LangChain `RecursiveCharacterTextSplitter` | Hierarchy-aware splitting preserves semantic coherence at paragraph → sentence → word boundaries |
| Validation | class-validator + class-transformer | Declarative DTO validation at the controller layer |

### Frontend

| Concern | Choice | Why |
|---------|--------|-----|
| Framework | Next.js 16, App Router | File-based routing; API routes double as CORS proxy to backend |
| Language | TypeScript strict | Shared type contracts with the backend (types mirror backend DTOs) |
| Styling | Tailwind CSS v4 | Dark-first design tokens via CSS custom properties |
| UI primitives | shadcn/ui | Unstyled-at-core, project-owned — no abstraction penalty |
| Charts | Recharts | Composable chart primitives; `ResponsiveContainer` handles fluid layouts |
| Icons | Lucide React | Consistent 24px SVG set with full tree-shaking |

---

## Key Engineering Decisions

### 1. Retrieval Confidence Scoring

Rather than blindly passing retrieved chunks to the LLM, the `RetrievalValidatorService` inspects the top cosine similarity score and chunk count before generation:

```
topScore > 0.85 AND chunks ≥ 3  →  HIGH   (answer normally with citations)
topScore > 0.70 AND chunks ≥ 2  →  MEDIUM (answer cautiously, flag limitations)
otherwise                        →  LOW    (surface uncertainty explicitly)
```

This changes both the system prompt instruction injected into the context and the confidence badge shown in the UI — giving end users a calibrated signal about answer reliability.

### 2. Token Budget Management

The `ContextBuilderService` enforces hard token ceilings per section before sending to the LLM:

| Section | Token Budget |
|---------|-------------|
| System instructions | 300 |
| Conversation history | 800 |
| Retrieved chunks | 2,500 |

Token estimation uses a 4-characters-per-token heuristic (fast, no tokenizer dependency). If a section exceeds its budget, items are dropped tail-first. This prevents silent context overflows that degrade answer quality without raising an exception.

### 3. Query Rewriting

The user's raw question goes through a dedicated rewrite step before embedding. An LLM call (temp=0.2, max_tokens=200) resolves pronouns and ambiguous references using conversation history, then produces a self-contained search query. A degraded version (direct question passthrough) activates automatically if the rewrite call fails — so retrieval still runs.

### 4. Layered Infrastructure vs. Tight Coupling

The `LlmService` and `EmbeddingsService` each sit behind a provider interface. Swapping from OpenAI to another model provider requires only a new `implements ILLMProvider` class — no changes propagate to the pipeline or business logic modules. The same pattern applies to embeddings.

### 5. HNSW Vector Index

The `document_chunks` table is indexed with HNSW (Hierarchical Navigable Small World) with `m=16, ef_construction=64`. This makes approximate nearest neighbor search scale gracefully as chunk count grows, at the cost of slightly higher build time compared to IVFFlat — an acceptable trade-off for a read-heavy retrieval workload.

---

## Ingestion Pipeline

A document goes through five sequential steps before it becomes queryable:

```
Input document (text content + source_type)
        │
        ▼
[1] INSERT into documents table → obtain document_id (UUID)
        │
        ▼
[2] DocumentCleaner.cleanText()
    Normalizes line endings, collapses whitespace, trims
        │
        ▼
[3] TextChunker.chunk()   ← LangChain RecursiveCharacterTextSplitter
    chunkSize=500 chars · chunkOverlap=80 chars
    Split priority: \n\n → \n → space → character
        │
        ▼
[4] EmbeddingsService.embedBatch()   ← OpenAI text-embedding-3-small
    All chunks embedded in a single batched API call → number[][]
        │
        ▼
[5] Bulk INSERT into document_chunks
    Stores: content, embedding vector(1536), metadata, chunk_index
```

**Response:** `{ document_id, chunk_count }`

---

## RAG Query Pipeline

```
User question + conversation history
        │
        ▼
[a] QueryRewriterService  — LLM call, temp=0.2
    Produces standalone search query from conversational context
        │
        ▼
[b] EmbeddingsService.embed(rewrittenQuery)
    Single vector for similarity search
        │
        ▼
[c] VectorRetrieverService — Supabase RPC: match_documents()
    SELECT ... ORDER BY embedding <=> query_embedding LIMIT topK
    Optional: filter by source_type metadata
        │
        ▼
[d] RetrievalValidatorService
    Inspects top similarity score + chunk count → HIGH / MEDIUM / LOW
        │
        ▼
[e] ContextBuilderService
    Assembles: system prompt + confidence instruction + history + chunks
    Token-budget enforced per section
        │
        ▼
[f] PromptBuilderService
    Constructs OpenAI messages array: [{role: system, ...}, {role: user, ...}]
        │
        ▼
[g] LlmService.chat()  ← OpenAI GPT-4o-mini, temp=0.3
        │
        ▼
[h] CitationService.formatCitations()
    Deduplicates sources by document name → SourceCitation[]
        │
        ▼
Response: { answer, sources, tokens_used, retrieval_confidence, metrics, latency_ms }
```

---

## Database Schema

```sql
-- Stores original document content
CREATE TABLE documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content     TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('pdf','markdown','slack','github')),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Stores chunks with their embeddings
CREATE TABLE document_chunks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content      TEXT NOT NULL,
  embedding    vector(1536),          -- OpenAI text-embedding-3-small
  metadata     JSONB NOT NULL DEFAULT '{}',
  chunk_index  INTEGER NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for approximate nearest neighbor search
CREATE INDEX document_chunks_embedding_idx
  ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Similarity search function
CREATE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count     INT DEFAULT 5,
  filter          JSONB DEFAULT '{}'
) RETURNS TABLE (id UUID, document_id UUID, content TEXT, metadata JSONB, similarity FLOAT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT dc.id, dc.document_id, dc.content, dc.metadata,
         1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE CASE WHEN filter->>'source_type' IS NOT NULL
             THEN dc.metadata->>'type' = filter->>'source_type'
             ELSE true END
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END; $$;

-- Chat history tables
CREATE TABLE chat_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NULL,
  title      TEXT,
  metadata   JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content     TEXT NOT NULL,
  sources     JSONB,
  metadata    JSONB DEFAULT '{}',
  tokens_used INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

---

## API Reference

### Ingestion

```http
POST /ingestion/upload
Content-Type: application/json

{
  "content": "string",
  "source_type": "pdf" | "markdown" | "slack" | "github",
  "fileName": "string (optional)",
  "metadata": { ...arbitrary key-value pairs }
}
```

```json
// 201 Created
{
  "success": true,
  "document_id": "3f2e1a...",
  "chunk_count": 18,
  "message": "Document uploaded successfully. Created 18 chunk(s)."
}
```

### Chat

```http
POST /chat
Content-Type: application/json

{
  "message": "What is our Q3 refund rate?",
  "session_id": "optional — omit to start a new session"
}
```

```json
// 200 OK
{
  "answer": "According to the Q3 Operations Report, the refund rate was 3.2%...",
  "sources": [
    {
      "document_name": "q3-ops-report.pdf",
      "source_type": "pdf",
      "similarity": 0.924,
      "chunk_index": 7
    }
  ],
  "session_id": "uuid",
  "tokens_used": 512,
  "retrieval_confidence": "high",
  "retrieval_metadata": {
    "strategy": "Hybrid (BM25 + Vector)",
    "latency_ms": 1340,
    "sources_found": 4,
    "confidence": "high",
    "rewritten_query": "Q3 third-quarter refund rate percentage operations report"
  },
  "model": "GPT-4.1-mini",
  "latency_ms": 1340
}
```

### Documents

```http
GET    /documents        # List all documents with chunk_count and status
POST   /documents        # Create document record (without ingestion)
DELETE /documents/:id    # Delete document and all its chunks → 204 No Content
GET    /chat/sessions    # List recent chat sessions
```

### PDF Upload (Next.js proxy route)

```http
POST /api/upload-pdf
Content-Type: multipart/form-data

file: <binary PDF>
```

Text is extracted server-side by `pdf-parse`, then forwarded to `/ingestion/process` as JSON. This route lives in the Next.js layer to avoid multipart/multer issues in the NestJS backend.

---

## Frontend Overview

The frontend is a Next.js 16 App Router application with three pages. It communicates with the backend exclusively through Next.js API routes (`/api/*`) that act as a thin proxy — keeping the backend URL server-side and sidestepping CORS.

### Chat Page (`/`)

- `useChat` custom hook manages the full message lifecycle: sending, optimistic UI update, streaming simulation (character-by-character reveal at 15ms intervals), session ID persistence across turns, and error recovery
- `SourcesPanel` renders alongside chat — shows retrieval configuration, per-source similarity scores with color-coded confidence (green ≥ 85%, amber ≥ 70%, red below), and opens a `Sheet` drawer for chunk-level preview
- `QueryTransformation` surfaces the rewritten query when it differs from the original input — provides transparency into the retrieval process
- `ConfidenceWarning` renders an amber alert when `retrieval_confidence === 'low'`

### Documents Page (`/documents`)

- `UploadZone` handles both click-to-browse and drag-and-drop; PDF files are sent as `multipart/form-data` to `/api/upload-pdf` (server-side text extraction via `pdf-parse`), while Markdown and plain text files are read client-side with `file.text()`
- `IngestionProgress` renders a five-segment bar (uploaded → parsing → chunking → embedding → indexed) with amber pulse animation on the active stage
- `useDocuments` refetches the document list after each upload or delete so the table stays current without a manual refresh
- Each row in the document table has a trash icon button; clicking it calls `DELETE /api/documents/:id`, which proxies to the backend and removes both the document and all its associated chunks

### Dashboard (`/dashboard`)

- `Promise.all` fetches documents and sessions in parallel on mount, then derives computed metrics (indexed count, total chunks, failure count) client-side
- `LatencyChart` uses Recharts `AreaChart` with a CSS linear gradient fill and a static 7-day demo dataset (real latency tracking is a roadmap item)
- `ActivityFeed` merges document and session events into a unified chronological log

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── infrastructure/
│   │   │   ├── embeddings/          # IEmbeddingProvider + OpenAI impl
│   │   │   ├── llm/                 # ILLMProvider + OpenAI impl + TokenEstimator
│   │   │   ├── supabase/            # SupabaseService (singleton client)
│   │   │   └── langchain/
│   │   │       ├── prompts/         # system/default.md · rewrite/default.md
│   │   │       └── splitters/       # RecursiveCharacterTextSplitter wrapper
│   │   ├── modules/
│   │   │   ├── ingestion/
│   │   │   │   ├── ingestion.pipeline.ts     # 5-step orchestrator
│   │   │   │   ├── chunking/text-chunker.ts  # LangChain splitter
│   │   │   │   └── processors/document-cleaner.ts
│   │   │   ├── rag/
│   │   │   │   ├── rag-pipeline.service.ts   # 9-step orchestrator
│   │   │   │   ├── query-rewriter.service.ts
│   │   │   │   ├── retrieval-validator.service.ts
│   │   │   │   ├── context-builder.service.ts
│   │   │   │   ├── prompt-builder.service.ts
│   │   │   │   ├── citation.service.ts
│   │   │   │   └── strategies/
│   │   │   │       └── vector-retriever.service.ts
│   │   │   ├── chat/                # Session management + RAG integration
│   │   │   └── documents/           # CRUD + chunk_count aggregation
│   │   ├── app.module.ts
│   │   └── main.ts                  # CORS, ValidationPipe, bootstrap
│   └── supabase/migrations/         # 5 SQL migration files
│
├── frontend/
│   ├── app/
│   │   ├── api/                     # Proxy routes (chat, documents, documents/[id], ingestion, sessions, upload-pdf)
│   │   ├── dashboard/page.tsx
│   │   ├── documents/page.tsx
│   │   ├── page.tsx                 # Chat page (root)
│   │   ├── layout.tsx               # Root layout: Sidebar + main
│   │   └── globals.css              # Tailwind v4 + CSS custom properties (dark theme)
│   ├── components/
│   │   ├── chat/                    # ChatArea, ChatMessage, ChatInput, StreamingIndicator,
│   │   │                            # ConfidenceWarning, ModelBadge, QueryTransformation
│   │   ├── sources/                 # SourcesPanel, SourceCard, SourcePreview, RetrievalConfig
│   │   ├── documents/               # UploadZone, DocumentList, IngestionProgress
│   │   ├── dashboard/               # StatCard, LatencyChart, PipelineStats, ActivityFeed, SystemConfig
│   │   ├── layout/                  # Sidebar
│   │   └── ui/                      # shadcn/ui: Button, Card, Badge, Sheet, ScrollArea, Skeleton…
│   ├── hooks/
│   │   ├── use-chat.ts              # Message state, streaming sim, session persistence
│   │   ├── use-documents.ts         # Upload (PDF + text) + list + delete + refetch
│   │   └── use-sessions.ts          # Session list for sidebar
│   └── lib/
│       ├── api.ts                   # Centralized fetch client (/api/*)
│       ├── types.ts                 # Shared TypeScript interfaces (mirror backend DTOs)
│       └── utils.ts                 # cn() — clsx + tailwind-merge
│
└── supabase/
    └── migrations/                  # 001–005: tables, extensions, indexes, RPC function
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- A Supabase project (free tier works) with the `vector` extension enabled
- OpenAI API key

### Backend

```bash
cd backend
npm install

# Copy and fill in credentials
cp .env.example .env
```

Apply migrations to your Supabase project (SQL Editor or CLI):

```
supabase/migrations/001_create_documents_table.sql
supabase/migrations/002_create_document_chunks.sql
supabase/migrations/003_create_chat_sessions.sql
supabase/migrations/004_create_messages.sql
supabase/migrations/005_create_match_documents_fn.sql
```

```bash
npm run start:dev     # Starts on port 3000
```

### Frontend

```bash
cd frontend
npm install
# BACKEND_URL defaults to http://localhost:3000 — override in .env.local if needed
npm run dev           # Starts on port 3001
```

### Quick Smoke Test

```bash
# 1. Ingest a document
curl -X POST http://localhost:3000/ingestion/upload \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Remote work is allowed up to 3 days per week for all full-time employees.",
    "source_type": "markdown",
    "fileName": "remote-work-policy.md"
  }'

# 2. Query it
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many days can I work remotely?"}'
```

### Environment Variables

**Backend (`backend/.env`)**

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✓ | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | ✓ | Supabase anon key |
| `OPENAI_API_KEY` | ✓ | OpenAI API key |
| `LLM_MODEL` | — | Defaults to `gpt-4o-mini` |
| `PORT` | — | Defaults to `3000` |

**Frontend (`frontend/.env.local`)**

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | — | Defaults to `http://localhost:3000` |

---

## Testing

```bash
cd backend
npm test            # Unit tests (Jest)
npm run test:cov    # Coverage report
npm run test:e2e    # End-to-end tests
```

Unit tests cover: `CitationService`, `ContextBuilderService`, `RetrievalValidatorService`, `VectorRetrieverService`, `TokenEstimatorService`.

---

## Skills Demonstrated

This project covers the full spectrum of what an AI Engineer or Backend Developer role requires in an AI-first stack:

- **RAG architecture** — end-to-end pipeline design with retrieval validation, query rewriting, and confidence-aware generation
- **Vector database** — pgvector with HNSW indexing, cosine similarity search via custom SQL RPC
- **LLM integration** — OpenAI chat completions and embeddings, prompt engineering, token management
- **LangChain** — `RecursiveCharacterTextSplitter` for semantic-aware chunking
- **NestJS** — modular architecture, dependency injection, provider interfaces, DTO validation
- **Next.js App Router** — file-based routing, server-side API proxy routes, client/server component separation
- **TypeScript** — strict mode, interface-driven design, shared type contracts across frontend and backend
- **Database design** — relational schema with JSONB metadata, cascade deletes, composite indexes
- **React patterns** — custom hooks, controlled components, optimistic UI, streaming simulation
- **Tailwind CSS v4** — dark theme via CSS custom properties, utility-first responsive layouts
