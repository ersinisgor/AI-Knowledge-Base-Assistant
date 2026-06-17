# System Architecture — TechNova Solutions

## Overview

The system is built as a modular monolith — a single deployable unit structured like microservices internally. This gives us the simplicity of a monolith with the team autonomy of microservices, without the operational overhead of distributed systems at our current scale.

## Components

### API Layer (NestJS Controllers)
- Entry point for all HTTP requests
- Handles input validation via DTOs
- Delegates business logic to the Service Layer

### Service Layer
- Contains all business logic
- Orchestrates calls to repositories, external APIs, and AI services
- Emits events to the WebSocket Gateway when state changes

### Repository Layer
- All database access lives here
- Uses Supabase JS client
- Returns typed domain objects — never raw database rows to the service layer

### AI Layer (LangChain + RAG)
- Accepts user queries
- Rewrites queries for better retrieval
- Embeds queries using OpenAI text-embedding-3-small
- Searches pgvector for the top 5 most relevant chunks
- Assembles context and generates an answer using GPT-4o-mini
- Returns the answer with source citations and confidence score

## RAG Pipeline (Detailed)

1. Receive user query
2. Rewrite query using an LLM call (temperature=0.2) to resolve pronouns and ambiguous references
3. Embed the rewritten query via OpenAI text-embedding-3-small (1536 dimensions)
4. Search pgvector using cosine similarity (`<=>` operator) — retrieve top 5 chunks
5. Score retrieval confidence based on top similarity score and chunk count
6. Assemble token-budgeted context (system: 300 tokens, history: 800 tokens, chunks: 2500 tokens)
7. Send to GPT-4o-mini with citation-enforcing system prompt
8. Return answer with deduplicated source citations

## Realtime Layer

- WebSocket Gateway built on Socket.io
- Connected clients are organized by user ID into rooms
- Events emitted: `task.assigned`, `comment.added`, `status.changed`, `ai.response.stream`
- AI responses are streamed token-by-token over WebSocket for a real-time feel

## Ingestion Pipeline

1. Receive document (PDF, Markdown, or plain text)
2. Clean and normalize text
3. Split into chunks (500 chars, 80-char overlap) using LangChain RecursiveCharacterTextSplitter
4. Embed all chunks in a single batched OpenAI API call
5. Store chunks with embeddings in the `document_chunks` table

## Infrastructure

- Backend: AWS ECS (Fargate) — auto-scales based on CPU/memory
- Database: Supabase (managed PostgreSQL with pgvector)
- Frontend: Vercel
- CDN: CloudFront for static assets
- Monitoring: Datadog (APM + logs + dashboards)
