# RAG Pipeline Design

Date: 2026-05-11
Status: Approved
Scope: First subsystem — RAG pipeline with vector retrieval, LLM answer generation, session-based memory, source citation, query rewriting, and context window management via REST.

---

## 1. Overview

Build a production-grade RAG pipeline that connects the existing ingestion system to the chat module. Users can ask questions, the system retrieves relevant document chunks via vector similarity, generates grounded answers with source citations, and maintains conversation history per session.

All responses are via REST initially. WebSocket streaming will be a separate subsystem.

---

## 2. Module Structure

```
src/
├── modules/
│   ├── chat/                              # EXISTING — extend
│   │   ├── chat.controller.ts             # Extend with RAG endpoint
│   │   ├── chat.service.ts                # Rewrite: session management + pipeline calls
│   │   ├── chat.module.ts                 # Add new providers
│   │   └── dto/
│   │       ├── chat-message.dto.ts        # Update: add session_id
│   │       └── chat-response.dto.ts       # Update: add sources, session_id, tokens
│   ├── rag/                               # NEW
│   │   ├── rag.module.ts
│   │   ├── rag-pipeline.service.ts        # Orchestrates the full flow
│   │   ├── query-rewriter.service.ts      # LLM-based query rewriting
│   │   ├── retrieval-filter.service.ts    # Build metadata/constraint filters
│   │   ├── retrieval-validator.service.ts # Validate retrieval quality
│   │   ├── context-builder.service.ts     # Data organization + token budgeting
│   │   ├── prompt-builder.service.ts      # Final prompt formatting
│   │   ├── citation.service.ts            # Normalize + format citations
│   │   ├── strategies/
│   │   │   ├── retriever.interface.ts     # Base retriever strategy interface
│   │   │   └── vector-retriever.service.ts # pgvector cosine similarity
│   │   └── dto/
│   │       ├── rag-query.dto.ts
│   │       └── rag-response.dto.ts
│   ├── ingestion/                         # EXISTING — no changes
│   └── documents/                         # EXISTING — no changes
├── infrastructure/
│   ├── supabase/                          # EXISTING — no changes
│   ├── llm/                               # NEW
│   │   ├── llm.module.ts                  # Global module
│   │   ├── llm.service.ts                 # Chat completion facade
│   │   ├── providers/
│   │   │   ├── llm-provider.interface.ts  # ILLMProvider interface
│   │   │   └── openai.provider.ts         # OpenAI implementation
│   │   └── token-estimator.service.ts     # Token counting utility
│   ├── embeddings/                        # NEW
│   │   ├── embeddings.module.ts           # Global module
│   │   ├── embeddings.service.ts          # Embedding facade
│   │   └── providers/
│   │       ├── embedding-provider.interface.ts  # IEmbeddingProvider interface
│   │       └── openai-embedding.provider.ts     # Uses LangChain internally
│   └── langchain/                         # NEW
│       ├── splitters/
│       │   ├── splitter.interface.ts      # ITextSplitter interface
│       │   └── recursive-text-splitter.ts # Current implementation
│       ├── loaders/
│       │   ├── loader.interface.ts        # IDocumentLoader interface
│       │   └── pdf-loader.adapter.ts      # Wraps LangChain PDFLoader
│       └── prompts/
│           ├── system/default.md
│           ├── rewrite/default.md
│           └── citation/default.md
```

---

## 3. Database Changes

Two new tables for session-based memory. No changes to existing tables.

### chat_sessions

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_chat_sessions_created_at ON chat_sessions(created_at);
```

### messages

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  sources JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_created_at ON messages(session_id, created_at);
CREATE INDEX idx_messages_role ON messages(role);
```

---

## 4. Pipeline Flow

```
POST /chat/message
  body: { message: "...", session_id?: "uuid" }
↓
ChatController
  → ChatService.handleMessage()
    1. Get or create session
    2. Store user message in DB
    3. Load recent message history (last 10 messages by default)
    4. RagPipelineService.query()
       a. QueryRewriterService
          - Input: original question + recent history
          - Output: improved search query
          - Original question preserved for final generation
       b. Embed the rewritten query (EmbeddingsService)
       c. RetrievalFilterService
          - Build metadata constraints from request context
          - Prepare filters: source_type, date range, etc.
          - Extensible for future multi-tenant/workspace filtering
       d. RetrieverStrategy (VectorRetriever)
          - pgvector cosine similarity search
          - Apply filters from step c
          - Return top-K chunks with metadata + similarity scores
       e. RetrievalValidatorService
          - Check similarity thresholds
          - Detect empty/weak retrievals
          - Flag low-confidence results
          - Support fallback behavior
       f. ContextBuilderService
          - Deduplicate semantically overlapping chunks
          - Prioritize: similarity → recency → source type → diversity
          - Structure context sections in order:
            system prompt → conversation history → retrieved chunks
          - Token budget allocation (adaptive, configurable)
          - Trim within each budget section
       g. PromptBuilderService
          - Take structured context from ContextBuilder
          - Apply prompt template (loaded from file)
          - Include retrieval confidence instruction
          - Produce final LLM-ready messages array
       h. LlmService.chat()
          - OpenAI chat completion via provider interface
          - Model: configurable (default: gpt-4o-mini)
          - Returns: answer text + token usage
       i. CitationService
          - Normalize source metadata from retrieved chunks
          - Deduplicate citations
          - Format consistent citation objects
          - Prepare frontend-safe source references
    5. Store assistant response in DB
       - sources: citation data
       - tokens_used: LLM token usage
       - metadata: pipeline metrics
    6. Return response
       - answer, cited sources, session_id, tokens_used
```

---

## 5. Retrieval Strategy

### Retriever Interface

```typescript
export interface IRetrieverStrategy {
  retrieve(
    query: string,
    embedding: number[],
    filters: RetrievalFilters,
    topK: number
  ): Promise<RetrievedChunk[]>;
}
```

Initial implementation: `VectorRetriever` using pgvector cosine similarity via Supabase RPC or raw SQL. Default top-K: 5. Future: `HybridRetriever`.

### Retrieval Confidence Levels

| Confidence | Condition | LLM Instruction |
|-----------|-----------|-----------------|
| High | Top chunk score > 0.85, 3+ relevant chunks | Answer normally with citations |
| Medium | Top chunk score > 0.7, 2+ chunks | Answer but note limited sources |
| Low | Top chunk score < 0.7 or < 2 chunks | Answer cautiously, state limitations |

Note: Scores are cosine similarity (1 - cosine_distance). pgvector's `<=>` operator returns cosine distance, so score = 1 - distance.

### Retrieval Filters

`RetrievalFilterService` builds metadata constraints:
- source_type filtering (pdf, markdown, slack, github)
- date range filtering
- Extensible for future workspace/tenant filtering

---

## 6. Context Window Strategy

### Token Budget (Adaptive, Configurable)

| Section | Default Budget | Adaptive Rule |
|---------|---------------|---------------|
| System prompt | 300 tokens | Fixed — never trimmed |
| Conversation history | 800 tokens | Expands for long conversations, shrinks when retrieval confidence is high |
| Retrieved chunks | 2500 tokens | Expands for high confidence, shrinks for long conversations |
| Response reserve | 400 tokens | Fixed — reserved for LLM output |

Budget ratios are configurable via `TokenBudgetConfig` interface.

### Context Assembly Order

```
=== SYSTEM INSTRUCTIONS ===
{system_prompt}
{confidence_instruction — dynamically added based on RetrievalValidator}

=== CONVERSATION HISTORY ===
{prioritized messages — recent user messages prioritized, repetitive responses trimmed}

=== RETRIEVED KNOWLEDGE ===
[Source]
Document: {document_name}
Type: {source_type}
Similarity: {score}
Created: {created_at}

Content:
{chunk_content}
---

=== RETRIEVAL CONFIDENCE ===
{high | medium | low}

=== USER QUESTION ===
{original_user_question}
```

### Context Building Pipeline

```
Retrieved Chunks (ranked by similarity)
→ Deduplication (remove semantically overlapping chunks)
→ Priority Ranking (similarity → recency → source type → diversity)
→ Token Budget Application (trim lowest-priority to fit budget)
→ Format with Rich Metadata
→ Assemble into sections
```

---

## 7. Prompt Templates

### System Prompt (stored in infrastructure/langchain/prompts/system/default.md)

```
You are an AI knowledge base assistant for internal company knowledge.
Answer questions based ONLY on the provided context.

Behavior rules:
- Prioritize retrieved knowledge over general assumptions
- Explicitly acknowledge uncertainty when context is insufficient
- Clearly separate known information from unknown
- Cite source documents for every claim derived from retrieved context
- If retrieval confidence is LOW, answer cautiously and state limitations
- If sources conflict, present both perspectives with their source references
- If documentation is incomplete, say so — do not fabricate details
- Never generate code, API details, or implementation specifics not in the context
- Prefer concise, evidence-grounded answers

Citation rules:
- Reference the source document name when making claims from retrieved chunks
- Only cite sources that appear in the RETRIEVED KNOWLEDGE section
- Do not cite sources for information not present in the context
- Format citations as: "According to [Document Name], ..."
```

### Query Rewrite Prompt (stored in infrastructure/langchain/prompts/rewrite/default.md)

```
Given the conversation history, rewrite the user's question as a standalone
search query optimized for semantic retrieval.

Rules:
- Preserve the original meaning and intent
- Preserve all technical terminology exactly as written
- Resolve ambiguous references using conversation history
- Do NOT change the user's intent or add assumptions
- Optimize only for retrieval clarity
- Return ONLY the rewritten query, nothing else

History: {conversation_history}
Question: {user_question}
```

---

## 8. Provider Abstraction

### LLM Provider

```typescript
export interface ILLMProvider {
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse>;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  tokensUsed: { prompt: number; completion: number; total: number };
  model: string;
}
```

Initial: `OpenAIProvider`. Future: Anthropic, local models.

### Embedding Provider

```typescript
export interface IEmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

Initial: `OpenAIEmbeddingProvider` (uses LangChain's OpenAIEmbeddings internally). Designed for caching layer to be added between facade and provider.

### Framework Isolation

LangChain imports (`@langchain/openai`, etc.) only appear inside `infrastructure/` adapter files. Application services in `modules/` depend only on interfaces.

---

## 9. Failure Handling

| Failure | Behavior |
|---------|----------|
| Embedding API fails | Return error: "Unable to process query" |
| Empty retrieval | Return: "No relevant information found" with no sources |
| Weak retrieval (low scores) | RetrievalValidator flags, LLM gets cautious instruction |
| LLM timeout | Return error with retry suggestion |
| Token overflow | ContextBuilder trims to budget |
| Malformed context | Validation step catches and falls back |

---

## 10. Observability

Each pipeline step records timing metadata in the message's `metadata` JSONB:

```json
{
  "pipeline_metrics": {
    "query_rewrite_ms": 450,
    "embedding_ms": 120,
    "retrieval_ms": 85,
    "context_build_ms": 15,
    "llm_ms": 2100,
    "total_ms": 3200
  },
  "retrieval_scores": [0.92, 0.87, 0.81],
  "chunks_retrieved": 5,
  "retrieval_confidence": "high"
}
```

---

## 11. Out of Scope for This Subsystem

- WebSocket streaming (separate subsystem)
- Multi-source ingestion (GitHub, Slack — separate subsystem)
- Hybrid search + reranking (future enhancement)
- Authentication/multi-tenant
- Frontend
- Observability dashboard
