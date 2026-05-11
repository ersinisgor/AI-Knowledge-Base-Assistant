# AI Knowledge Base Assistant

A production-grade Retrieval-Augmented Generation (RAG) backend that lets users ask questions about company knowledge and receive accurate, source-cited answers powered by AI.

Built with **NestJS**, **Supabase + pgvector**, and **OpenAI**.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [RAG Pipeline](#rag-pipeline)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## How It Works

```
User asks a question
        |
        v
  Query Rewriter (LLM rephrases for better retrieval)
        |
        v
  Embedding (OpenAI text-embedding-3-small)
        |
        v
  Vector Search (pgvector cosine similarity via Supabase RPC)
        |
        v
  Retrieval Validation (confidence scoring)
        |
        v
  Context Building (token-budgeted assembly)
        |
        v
  LLM Completion (OpenAI GPT with system prompt + context)
        |
        v
  Citation Formatting (deduplicated source references)
        |
        v
  Answer with sources returned to user
```

---

## Architecture

```
src/
├── infrastructure/               # Shared infrastructure services
│   ├── llm/                      # LLM abstraction layer
│   │   ├── providers/
│   │   │   ├── llm-provider.interface.ts   # ILLMProvider, ChatMessage, LLMResponse
│   │   │   └── openai.provider.ts          # OpenAI GPT implementation
│   │   ├── llm.service.ts                  # Facade: delegates to active provider
│   │   ├── token-estimator.service.ts      # Token counting utility
│   │   └── llm.module.ts                   # Global module
│   │
│   ├── embeddings/                # Embedding abstraction layer
│   │   ├── providers/
│   │   │   ├── embedding-provider.interface.ts  # IEmbeddingProvider
│   │   │   └── openai-embedding.provider.ts     # OpenAI text-embedding-3-small
│   │   ├── embeddings.service.ts                # Facade: delegates to active provider
│   │   └── embeddings.module.ts                 # Global module
│   │
│   ├── supabase/                  # Database client
│   │   ├── supabase.service.ts
│   │   └── supabase.module.ts
│   │
│   └── langchain/                 # LangChain utilities
│       ├── splitters/
│       │   ├── splitter.interface.ts           # ITextSplitter, Chunk
│       │   └── recursive-text-splitter.ts      # RecursiveCharacterTextSplitter adapter
│       └── prompts/
│           ├── system/default.md               # System prompt template
│           └── rewrite/default.md              # Query rewrite prompt template
│
├── modules/
│   ├── documents/                 # Document CRUD
│   │   ├── documents.controller.ts
│   │   ├── documents.service.ts
│   │   └── dto/
│   │       ├── create-document.dto.ts
│   │       └── document-response.dto.ts
│   │
│   ├── ingestion/                 # Document processing pipeline
│   │   ├── ingestion.controller.ts
│   │   ├── ingestion.service.ts
│   │   ├── ingestion.pipeline.ts              # clean -> chunk -> embed -> store
│   │   ├── processors/document-cleaner.ts     # Text normalization
│   │   ├── chunking/text-chunker.ts           # 500 chars, 80 overlap
│   │   └── dto/
│   │       ├── ingest-content.dto.ts
│   │       ├── ingest-response.dto.ts
│   │       └── upload-document.dto.ts
│   │
│   ├── chat/                      # Chat with session management
│   │   ├── chat.controller.ts
│   │   ├── chat.service.ts                    # Session mgmt + RAG integration
│   │   └── dto/
│   │       ├── chat-message.dto.ts
│   │       └── chat-response.dto.ts
│   │
│   └── rag/                       # RAG pipeline
│       ├── rag-pipeline.service.ts            # Orchestrator
│       ├── query-rewriter.service.ts          # LLM query rephrasing
│       ├── strategies/
│       │   ├── retriever.interface.ts         # IRetrieverStrategy
│       │   └── vector-retriever.service.ts    # pgvector implementation
│       ├── retrieval-filter.service.ts        # Metadata filter builder
│       ├── retrieval-validator.service.ts     # Confidence scoring
│       ├── context-builder.service.ts         # Token-budgeted context assembly
│       ├── prompt-builder.service.ts          # Message formatting
│       ├── citation.service.ts               # Source deduplication + formatting
│       └── dto/
│           ├── rag-query.dto.ts
│           └── rag-response.dto.ts
│
├── app.module.ts
├── app.controller.ts
└── main.ts                                     # CORS, validation pipe, port config
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | NestJS 11, TypeScript (strict) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **LLM** | OpenAI GPT (chat completions) |
| **Embeddings** | OpenAI text-embedding-3-small (1536-dim) |
| **Text Splitting** | LangChain RecursiveCharacterTextSplitter |
| **Validation** | class-validator, class-transformer |
| **Testing** | Jest, ts-jest, Supertest |

---

## API Reference

### Health Check

```
GET /
```

```json
"Hello World!"
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

Returns an array of document objects with `id`, `content`, `source_type`, `metadata`, and `created_at`.

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

**Upload document** (with filename)

```
POST /ingestion/upload
Content-Type: application/json

{
  "content": "Document text...",
  "source_type": "markdown",
  "fileName": "handbook.md",
  "metadata": { "category": "onboarding" }
}
```

Both endpoints return:

```json
{
  "success": true,
  "document_id": "uuid",
  "chunk_count": 12,
  "message": "Document ingested successfully"
}
```

**Ingestion pipeline steps:**
1. Create document record in database
2. Clean text (normalize whitespace, remove control characters)
3. Split into chunks (500 chars, 80 char overlap)
4. Generate embeddings for each chunk
5. Store chunks with embeddings in `document_chunks` table

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

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | yes | User question (1-1000 chars) |
| `session_id` | string | no | Resume an existing conversation |

Response:

```json
{
  "answer": "According to the Employee Handbook, the remote work policy allows...",
  "sources": [
    {
      "document_name": "Employee Handbook",
      "source_type": "pdf",
      "similarity": 0.92,
      "chunk_index": 3
    }
  ],
  "session_id": "uuid",
  "tokens_used": 487,
  "retrieval_confidence": "high"
}
```

**Chat flow:**
1. Get or create a chat session
2. Store user message
3. Load last 10 messages for context
4. Run RAG pipeline
5. Store assistant response with sources and metrics
6. Return answer with citations

---

## RAG Pipeline

The `RagPipelineService` orchestrates the following steps:

| Step | Service | Description |
|------|---------|-------------|
| 1. Query Rewrite | `QueryRewriterService` | LLM rephrases the user question into a standalone search query using conversation history (temp 0.2, max 200 tokens). Falls back to original query on failure. |
| 2. Embed Query | `EmbeddingsService` | Generates a 1536-dim vector using OpenAI text-embedding-3-small. |
| 3. Build Filters | `RetrievalFilterService` | Constructs metadata filter constraints (e.g., by `source_type`). |
| 4. Retrieve | `VectorRetrieverService` | Calls `match_documents` RPC in Supabase for cosine similarity search. Returns top-K chunks. |
| 5. Validate | `RetrievalValidatorService` | Scores retrieval confidence based on similarity and chunk count. |
| 6. Build Context | `ContextBuilderService` | Assembles chunks within a token budget (system: 300, history: 800, chunks: 2500). |
| 7. Build Prompt | `PromptBuilderService` | Formats system prompt, context, and user question into LLM messages. |
| 8. LLM Completion | `LlmService` | Sends messages to OpenAI GPT for answer generation. |
| 9. Format Citations | `CitationService` | Deduplicates sources by document name and formats citation objects. |

### Confidence Levels

| Level | Criteria |
|-------|----------|
| `high` | Top chunk similarity > 0.85 AND at least 3 chunks retrieved |
| `medium` | Top chunk similarity > 0.70 AND at least 2 chunks retrieved |
| `low` | All other cases |

---

## Database Schema

Managed via Supabase migrations in `supabase/migrations/`.

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
| `metadata` | JSONB | Chunk-level metadata (includes document name, type, index) |
| `chunk_index` | INTEGER | Position in original document |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

Indexed with HNSW for fast cosine similarity search.

### `chat_sessions`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Optional user reference |
| `title` | TEXT | Session title (auto-generated from first message) |
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
| `sources` | JSONB | Citation data for assistant messages |
| `metadata` | JSONB | Pipeline metrics and retrieval confidence |
| `tokens_used` | INTEGER | Token count |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `match_documents()` RPC

Supabase function for vector similarity search:

```sql
match_documents(query_embedding vector(1536), match_count INT, filter JSONB)
```

Returns matching chunks with cosine similarity scores, supports filtering by `source_type`.

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
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Variables](#environment-variables)).

### Database Setup

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

### Run the Application

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

The API starts at `http://localhost:3000` by default.

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

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | yes | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` | yes | Supabase anon/public key |
| `OPENAI_API_KEY` | yes | OpenAI API key |
| `PORT` | no | Server port (default: 3000) |

---

## Testing

```bash
# Run all unit tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

Test suites cover:
- `VectorRetrieverService` -- retrieval with Supabase RPC mocking
- `RetrievalValidatorService` -- confidence scoring thresholds
- `CitationService` -- source deduplication and formatting
- `ContextBuilderService` -- token budget allocation
- `TokenEstimatorService` -- token estimation accuracy
- `AppController` -- basic health check

---

## Roadmap

- [ ] WebSocket streaming for real-time AI responses
- [ ] Multi-source knowledge connectors (Slack, GitHub, incident reports)
- [ ] Advanced retrieval: reranking, hybrid search (keyword + vector)
- [ ] RAG evaluation system with quality metrics
- [ ] Document upload supporting PDF, DOCX, and other binary formats
- [ ] Frontend interface
- [ ] Authentication and multi-tenancy
- [ ] Rate limiting and usage analytics
