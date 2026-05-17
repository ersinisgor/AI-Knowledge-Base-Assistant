# AI Knowledge Base Assistant

A production-grade Retrieval-Augmented Generation (RAG) platform with an enterprise AI operations frontend. Users can ingest documents, query their knowledge base, and receive accurate, source-cited answers powered by AI.

Built with **NestJS** (backend), **Next.js 15** (frontend), **Supabase + pgvector**, and **OpenAI**.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Backend API Reference](#backend-api-reference)
- [Frontend Pages](#frontend-pages)
- [RAG Pipeline](#rag-pipeline)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│  Frontend (Next.js 15, port 3001)                    │
│  ┌────────┐  ┌───────────┐  ┌──────────┐            │
│  │  Chat  │  │ Documents │  │Dashboard │            │
│  └───┬────┘  └─────┬─────┘  └────┬─────┘            │
│      └──────┬───────┘────────────┘                   │
│             │  API Proxy Routes (/api/*)             │
└─────────────┼────────────────────────────────────────┘
              │
              v
┌──────────────────────────────────────────────────────┐
│  Backend (NestJS, port 3000)                         │
│  /chat  /documents  /ingestion/process  /chat/sessions│
│  ┌─────────────────────────────────────────┐         │
│  │          RAG Pipeline                    │         │
│  │  Query Rewrite → Embed → Retrieve →     │         │
│  │  Validate → Context → LLM → Cite        │         │
│  └─────────────────────────────────────────┘         │
└─────────────┼────────────────────────────────────────┘
              │
              v
┌──────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL + pgvector)                     │
│  documents · document_chunks · chat_sessions · messages│
└──────────────────────────────────────────────────────┘
```

The frontend proxies all API requests through Next.js API routes to the backend, keeping backend URLs internal.

---

## Tech Stack

### Backend

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 11, TypeScript (strict) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **LLM** | OpenAI GPT (chat completions) |
| **Embeddings** | OpenAI text-embedding-3-small (1536-dim) |
| **Text Splitting** | LangChain RecursiveCharacterTextSplitter |
| **Validation** | class-validator, class-transformer |

### Frontend

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router) |
| **UI Components** | shadcn/ui, Radix primitives |
| **Styling** | Tailwind CSS v4, dark theme |
| **Icons** | Lucide React |
| **Charts** | Recharts |
| **Language** | TypeScript (strict) |

---

## Project Structure

```
├── backend/                        # NestJS API server
│   ├── src/
│   │   ├── infrastructure/         # Shared infrastructure
│   │   │   ├── llm/                # LLM abstraction (OpenAI)
│   │   │   ├── embeddings/         # Embedding abstraction (OpenAI)
│   │   │   ├── supabase/           # Database client
│   │   │   └── langchain/          # Text splitting, prompt templates
│   │   ├── modules/
│   │   │   ├── documents/          # Document CRUD
│   │   │   ├── ingestion/          # Chunk → embed → store pipeline
│   │   │   ├── chat/               # Chat with session management
│   │   │   └── rag/                # RAG pipeline orchestrator
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   ├── supabase/                   # Migrations and config
│   └── package.json
│
├── frontend/                       # Next.js 15 frontend
│   ├── app/
│   │   ├── api/                    # Proxy routes → backend
│   │   │   ├── chat/route.ts
│   │   │   ├── documents/route.ts
│   │   │   ├── documents/[id]/route.ts  # DELETE proxy
│   │   │   ├── ingestion/route.ts
│   │   │   ├── sessions/route.ts
│   │   │   └── upload-pdf/route.ts # PDF parse + ingest proxy
│   │   ├── dashboard/page.tsx      # AI metrics dashboard
│   │   ├── documents/page.tsx      # Document upload & management
│   │   ├── layout.tsx              # Root layout with sidebar
│   │   ├── page.tsx                # Chat page
│   │   └── globals.css             # Dark theme tokens
│   ├── components/
│   │   ├── chat/                   # Messages, streaming, model badge
│   │   ├── dashboard/              # Stat cards, charts, activity feed
│   │   ├── documents/              # Upload zone, ingestion progress
│   │   ├── layout/                 # Sidebar navigation
│   │   ├── sources/                # Source cards, preview drawer
│   │   └── ui/                     # shadcn/ui primitives
│   ├── hooks/                      # useChat, useSessions, useDocuments
│   ├── lib/
│   │   ├── api.ts                  # API client
│   │   ├── types.ts                # Shared TypeScript types
│   │   └── utils.ts                # cn() utility
│   └── package.json
│
├── docs/                           # Design specs and plans
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- A Supabase project with pgvector enabled
- An OpenAI API key

### Installation

```bash
git clone https://github.com/ersinisgor/AI-Knowledge-Base-Assistant.git
cd AI-Knowledge-Base-Assistant
```

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your Supabase and OpenAI credentials
```

Run the migrations against your Supabase database:

```bash
supabase db push
```

Or apply them manually through the Supabase dashboard in order:
1. `001_create_documents_table.sql`
2. `002_create_document_chunks.sql`
3. `003_create_chat_sessions.sql`
4. `004_create_messages.sql`
5. `005_create_match_documents_fn.sql`

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:

```env
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
BACKEND_URL=http://localhost:3000
```

### Run the Application

```bash
# Terminal 1: Backend (port 3000)
cd backend
npm run start:dev

# Terminal 2: Frontend (port 3001)
cd frontend
npm run dev
```

Open http://localhost:3001 to access the frontend.

### Quick Test

```bash
# Ingest a document
curl -X POST http://localhost:3000/ingestion/process \
  -H "Content-Type: application/json" \
  -d '{"content": "Our company allows remote work up to 3 days per week.", "source_type": "markdown"}'

# Ask a question
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the remote work policy?"}'
```

---

## Backend API Reference

### Health Check

```
GET /
```

### Documents

**Create a document**

```
POST /documents
Content-Type: application/json

{
  "content": "Company policy states that...",
  "source_type": "markdown",
  "metadata": { "department": "engineering" }
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | yes | Document text (min 1 char) |
| `source_type` | enum | yes | `pdf`, `markdown`, `slack`, `github` |
| `metadata` | object | no | Arbitrary key-value metadata |

**List all documents**

```
GET /documents
```

Returns documents with `id`, `content`, `source_type`, `metadata`, `created_at`, `chunk_count`, and `status` (`indexed` or `uploaded`).

**Delete a document**

```
DELETE /documents/:id
```

Deletes the document and all its associated chunks. Returns `204 No Content`.

### Ingestion

**Process content** (raw text ingestion)

```
POST /ingestion/process
Content-Type: application/json

{
  "content": "Text to ingest...",
  "source_type": "pdf",
  "metadata": { "filename": "report.pdf" }
}
```

Returns:

```json
{
  "success": true,
  "document_id": "uuid",
  "chunk_count": 12,
  "message": "Document ingested successfully"
}
```

**Upload a PDF file** (via Next.js proxy — not called directly)

The frontend route `POST /api/upload-pdf` accepts `multipart/form-data` with a `file` field. It extracts the text using `pdf-parse` and forwards it to `/ingestion/process`. Supported formats: PDF, Markdown, plain text (max 10 MB).

### Chat

**Send a message**

```
POST /chat
Content-Type: application/json

{
  "message": "What is our remote work policy?",
  "session_id": "optional-existing-session-uuid"
}
```

Response:

```json
{
  "answer": "According to the Employee Handbook, the remote work policy allows...",
  "sources": [
    {
      "document_name": "Employee Handbook",
      "source_type": "pdf",
      "similarity": 0.92,
      "chunk_index": 3,
      "chunk_content": "..."
    }
  ],
  "session_id": "uuid",
  "tokens_used": 487,
  "retrieval_confidence": "high",
  "retrieval_metadata": {
    "strategy": "Hybrid (BM25 + Vector)",
    "latency_ms": 1200,
    "sources_found": 5,
    "confidence": "high"
  },
  "model": "GPT-4.1-mini",
  "latency_ms": 1200
}
```

**List sessions**

```
GET /chat/sessions
```

Returns recent chat sessions with `id`, `title`, `created_at`, `updated_at`.

---

## Frontend Pages

### Chat (`/`)

Interactive chat interface with streaming text, source citations, query transformation display, and a collapsible sources panel showing retrieval configuration and individual source cards with similarity scores.

### Documents (`/documents`)

Document management with drag-and-drop upload zone supporting PDF, Markdown, and plain text files. PDFs are parsed server-side (text extraction via `pdf-parse`) before ingestion. The document table shows ingestion lifecycle progress (uploaded → parsing → chunking → embedding → indexed), status badges, chunk counts, and a per-row delete button that removes the document and all its chunks.

### Dashboard (`/dashboard`)

Operations dashboard with metric cards (documents, sessions, chunks, confidence), a 7-day latency chart, ingestion pipeline stats, system configuration display, and a live activity feed.

---

## RAG Pipeline

The `RagPipelineService` orchestrates the following steps:

| Step | Service | Description |
|------|---------|-------------|
| 1. Query Rewrite | `QueryRewriterService` | LLM rephrases the user question for better retrieval |
| 2. Embed Query | `EmbeddingsService` | 1536-dim vector via OpenAI text-embedding-3-small |
| 3. Build Filters | `RetrievalFilterService` | Metadata filter constraints |
| 4. Retrieve | `VectorRetrieverService` | `match_documents` RPC cosine similarity search |
| 5. Validate | `RetrievalValidatorService` | Confidence scoring |
| 6. Build Context | `ContextBuilderService` | Token-budgeted assembly (system: 300, history: 800, chunks: 2500) |
| 7. Build Prompt | `PromptBuilderService` | System prompt, context, and question formatting |
| 8. LLM Completion | `LlmService` | OpenAI GPT answer generation |
| 9. Format Citations | `CitationService` | Source deduplication and formatting |

---

## Database Schema

Managed via Supabase migrations in `backend/supabase/migrations/`.

### `documents`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `content` | TEXT | Original document content |
| `source_type` | TEXT | `pdf`, `markdown`, `slack`, or `github` |
| `metadata` | JSONB | Arbitrary metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `document_chunks`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `document_id` | UUID | FK to documents |
| `content` | TEXT | Chunk text |
| `embedding` | vector(1536) | OpenAI embedding |
| `metadata` | JSONB | Chunk-level metadata |
| `chunk_index` | INTEGER | Position in original document |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

Indexed with HNSW for fast cosine similarity search.

### `chat_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Optional user reference |
| `title` | TEXT | Session title (auto-generated) |
| `metadata` | JSONB | Session metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `messages`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `session_id` | UUID | FK to chat_sessions (CASCADE) |
| `role` | TEXT | `system`, `user`, `assistant`, or `tool` |
| `content` | TEXT | Message text |
| `sources` | JSONB | Citation data |
| `metadata` | JSONB | Pipeline metrics |
| `tokens_used` | INTEGER | Token count |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Supabase anon/public key |
| `OPENAI_API_KEY` | yes | OpenAI API key |
| `PORT` | no | Server port (default: 3000) |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `BACKEND_URL` | no | Backend URL (default: `http://localhost:3000`) |
| `PORT` | no | Frontend port (default: 3000) |

---

## Testing

```bash
# Backend tests
cd backend
npm test              # Run all unit tests
npm run test:watch    # Watch mode
npm run test:cov      # Coverage report
npm run test:e2e      # End-to-end tests
```

---

## Roadmap

- [x] Frontend interface (Next.js with chat, documents, dashboard)
- [ ] WebSocket streaming for real-time AI responses
- [ ] Multi-source knowledge connectors (Slack, GitHub, incident reports)
- [ ] Advanced retrieval: reranking, hybrid search (keyword + vector)
- [ ] RAG evaluation system with quality metrics
- [x] PDF upload via drag-and-drop or file picker (text extracted server-side)
- [ ] Document upload supporting DOCX and other binary formats
- [ ] Authentication and multi-tenancy
- [ ] Rate limiting and usage analytics
