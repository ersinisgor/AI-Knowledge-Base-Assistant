# RAG Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade RAG pipeline that retrieves relevant document chunks via vector similarity, generates grounded answers with source citations, and maintains conversation history per session.

**Architecture:** Pipeline orchestrator pattern — a `RagPipelineService` orchestrates query rewriting, embedding, retrieval, context building, prompt building, LLM completion, and citation formatting. Each step is a small, focused service. Provider abstraction isolates LLM/embedding dependencies behind interfaces.

**Tech Stack:** NestJS, TypeScript (strict), Supabase + pgvector, OpenAI API (gpt-4o-mini + text-embedding-3-small), LangChain (embeddings + text splitting only).

**Branch:** `feature/rag-pipeline`

**Design spec:** `docs/superpowers/specs/2026-05-11-rag-pipeline-design.md`

---

## File Map

### New Files

| File | Responsibility |
|------|---------------|
| `supabase/migrations/003_create_chat_sessions.sql` | Chat sessions table |
| `supabase/migrations/004_create_messages.sql` | Messages table with session FK |
| `supabase/migrations/005_create_match_documents_fn.sql` | pgvector RPC function for vector search |
| `src/infrastructure/llm/providers/llm-provider.interface.ts` | ILLMProvider, LLMOptions, LLMResponse, ChatMessage types |
| `src/infrastructure/llm/providers/openai.provider.ts` | OpenAI chat completion provider |
| `src/infrastructure/llm/llm.service.ts` | LLM facade, delegates to provider |
| `src/infrastructure/llm/llm.module.ts` | Global LLM module |
| `src/infrastructure/llm/token-estimator.service.ts` | Token estimation utility |
| `src/infrastructure/embeddings/providers/embedding-provider.interface.ts` | IEmbeddingProvider interface |
| `src/infrastructure/embeddings/providers/openai-embedding.provider.ts` | OpenAI embedding provider (uses LangChain internally) |
| `src/infrastructure/embeddings/embeddings.service.ts` | Embedding facade, delegates to provider |
| `src/infrastructure/embeddings/embeddings.module.ts` | Global embeddings module |
| `src/infrastructure/langchain/splitters/splitter.interface.ts` | ITextSplitter interface |
| `src/infrastructure/langchain/splitters/recursive-text-splitter.ts` | RecursiveCharacterTextSplitter adapter |
| `src/infrastructure/langchain/prompts/system/default.md` | System prompt template |
| `src/infrastructure/langchain/prompts/rewrite/default.md` | Query rewrite prompt template |
| `src/modules/rag/dto/rag-query.dto.ts` | RAG query input DTO |
| `src/modules/rag/dto/rag-response.dto.ts` | RAG response output DTO |
| `src/modules/rag/strategies/retriever.interface.ts` | IRetrieverStrategy, RetrievedChunk, RetrievalFilters types |
| `src/modules/rag/strategies/vector-retriever.service.ts` | pgvector cosine similarity retrieval |
| `src/modules/rag/strategies/vector-retriever.service.spec.ts` | Vector retriever tests |
| `src/modules/rag/retrieval-filter.service.ts` | Build metadata filter constraints |
| `src/modules/rag/retrieval-validator.service.ts` | Validate retrieval quality + confidence |
| `src/modules/rag/retrieval-validator.service.spec.ts` | Validator tests |
| `src/modules/rag/context-builder.service.ts` | Context assembly + token budgeting |
| `src/modules/rag/context-builder.service.spec.ts` | Context builder tests |
| `src/modules/rag/prompt-builder.service.ts` | Final prompt formatting from template |
| `src/modules/rag/query-rewriter.service.ts` | LLM-based query rewriting |
| `src/modules/rag/citation.service.ts` | Normalize + format citations |
| `src/modules/rag/citation.service.spec.ts` | Citation tests |
| `src/modules/rag/rag-pipeline.service.ts` | Full pipeline orchestrator |
| `src/modules/rag/rag.module.ts` | RAG module wiring |

### Modified Files

| File | Change |
|------|--------|
| `src/modules/chat/dto/chat-message.dto.ts` | Add optional session_id field |
| `src/modules/chat/dto/chat-response.dto.ts` | Add sources, session_id, tokens_used fields |
| `src/modules/chat/chat.service.ts` | Full rewrite: session management + RAG pipeline calls |
| `src/modules/chat/chat.controller.ts` | Minor update: new endpoint or adjust response |
| `src/modules/chat/chat.module.ts` | Import RAG module |
| `src/modules/ingestion/ingestion.module.ts` | Import EmbeddingsModule, remove old provider |
| `src/modules/ingestion/ingestion.pipeline.ts` | Use EmbeddingsService instead of OpenAIEmbeddingsService |
| `src/app.module.ts` | Add LlmModule, EmbeddingsModule, RagModule |

### Deleted Files

| File | Reason |
|------|--------|
| `src/modules/ingestion/embeddings/openai-embeddings.ts` | Replaced by infrastructure EmbeddingsModule |

---

### Task 1: Branch + Database Migrations

**Files:**
- Create: `supabase/migrations/003_create_chat_sessions.sql`
- Create: `supabase/migrations/004_create_messages.sql`
- Create: `supabase/migrations/005_create_match_documents_fn.sql`

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feature/rag-pipeline
```

- [ ] **Step 2: Create chat_sessions migration**

Create `supabase/migrations/003_create_chat_sessions.sql`:

```sql
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NULL,
  title TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at
ON chat_sessions(created_at DESC);

COMMENT ON TABLE chat_sessions IS 'Stores chat sessions for conversation memory';
```

- [ ] **Step 3: Create messages migration**

Create `supabase/migrations/004_create_messages.sql`:

```sql
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system', 'user', 'assistant', 'tool')),
  content TEXT NOT NULL,
  sources JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id
ON messages(session_id);

CREATE INDEX IF NOT EXISTS idx_messages_created_at
ON messages(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_role
ON messages(role);

COMMENT ON TABLE messages IS 'Stores chat messages with sources and metadata';
```

- [ ] **Step 4: Create vector search RPC function**

Create `supabase/migrations/005_create_match_documents_fn.sql`:

```sql
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_count INT DEFAULT 5,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  WHERE
    CASE
      WHEN filter->>'source_type' IS NOT NULL
        THEN dc.metadata->>'type' = filter->>'source_type'
      ELSE true
    END
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION match_documents IS 'Vector similarity search for RAG retrieval with optional metadata filtering';
```

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/003_create_chat_sessions.sql supabase/migrations/004_create_messages.sql supabase/migrations/005_create_match_documents_fn.sql
git commit -m "feat(db): add chat_sessions, messages tables and vector search RPC"
```

---

### Task 2: Provider Interfaces + Shared Types

**Files:**
- Create: `src/infrastructure/llm/providers/llm-provider.interface.ts`
- Create: `src/infrastructure/embeddings/providers/embedding-provider.interface.ts`

- [ ] **Step 1: Create LLM provider interface**

Create `src/infrastructure/llm/providers/llm-provider.interface.ts`:

```typescript
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface LLMResponse {
  content: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  model: string;
}

export interface ILLMProvider {
  chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse>;
}
```

- [ ] **Step 2: Create embedding provider interface**

Create `src/infrastructure/embeddings/providers/embedding-provider.interface.ts`:

```typescript
export interface IEmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/infrastructure/llm/providers/llm-provider.interface.ts src/infrastructure/embeddings/providers/embedding-provider.interface.ts
git commit -m "feat(infrastructure): add LLM and embedding provider interfaces"
```

---

### Task 3: LLM Infrastructure Module

**Files:**
- Create: `src/infrastructure/llm/providers/openai.provider.ts`
- Create: `src/infrastructure/llm/token-estimator.service.ts`
- Create: `src/infrastructure/llm/token-estimator.service.spec.ts`
- Create: `src/infrastructure/llm/llm.service.ts`
- Create: `src/infrastructure/llm/llm.module.ts`

- [ ] **Step 1: Install openai package**

```bash
npm install openai
```

- [ ] **Step 2: Write token estimator test**

Create `src/infrastructure/llm/token-estimator.service.spec.ts`:

```typescript
import { TokenEstimatorService } from './token-estimator.service';

describe('TokenEstimatorService', () => {
  let service: TokenEstimatorService;

  beforeEach(() => {
    service = new TokenEstimatorService();
  });

  describe('estimateTokens', () => {
    it('should estimate ~1 token per 4 characters for English text', () => {
      const text = 'Hello world, this is a test message';
      const tokens = service.estimateTokens(text);
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });

    it('should return 0 for empty string', () => {
      expect(service.estimateTokens('')).toBe(0);
    });

    it('should handle long text', () => {
      const text = 'a'.repeat(4000);
      const tokens = service.estimateTokens(text);
      expect(tokens).toBe(1000);
    });
  });

  describe('estimateMessagesTokens', () => {
    it('should sum tokens across all messages plus overhead', () => {
      const messages = [
        { role: 'system' as const, content: 'You are an assistant' },
        { role: 'user' as const, content: 'Hello' },
      ];
      const tokens = service.estimateMessagesTokens(messages);
      const sumOfContents = service.estimateTokens('You are an assistant') + service.estimateTokens('Hello');
      expect(tokens).toBe(sumOfContents + 2 * 4);
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/infrastructure/llm/token-estimator.service.spec.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement token estimator**

Create `src/infrastructure/llm/token-estimator.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ChatMessage } from './providers/llm-provider.interface';

@Injectable()
export class TokenEstimatorService {
  private readonly CHARS_PER_TOKEN = 4;
  private readonly MESSAGE_OVERHEAD = 4;

  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  estimateMessagesTokens(messages: ChatMessage[]): number {
    return messages.reduce(
      (sum, msg) => sum + this.estimateTokens(msg.content) + this.MESSAGE_OVERHEAD,
      0,
    );
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/infrastructure/llm/token-estimator.service.spec.ts --no-cache
```

Expected: PASS.

- [ ] **Step 6: Create OpenAI provider**

Create `src/infrastructure/llm/providers/openai.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ILLMProvider, ChatMessage, LLMOptions, LLMResponse } from './llm-provider.interface';

@Injectable()
export class OpenAIProvider implements ILLMProvider {
  private readonly logger = new Logger(OpenAIProvider.name);
  private readonly client: OpenAI;
  private readonly defaultModel: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.client = new OpenAI({ apiKey });
    this.defaultModel = this.configService.get<string>('LLM_MODEL') || 'gpt-4o-mini';
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    const model = options?.model || this.defaultModel;

    this.logger.debug(`Calling OpenAI chat with model: ${model}`);

    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens,
    });

    const choice = response.choices[0];
    const content = choice?.message?.content || '';

    return {
      content,
      tokensUsed: {
        prompt: response.usage?.prompt_tokens ?? 0,
        completion: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      model: response.model,
    };
  }
}
```

- [ ] **Step 7: Create LLM service facade**

Create `src/infrastructure/llm/llm.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ILLMProvider, ChatMessage, LLMOptions, LLMResponse } from './providers/llm-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';

@Injectable()
export class LlmService {
  private readonly provider: ILLMProvider;

  constructor(private readonly openAIProvider: OpenAIProvider) {
    this.provider = this.openAIProvider;
  }

  async chat(messages: ChatMessage[], options?: LLMOptions): Promise<LLMResponse> {
    return this.provider.chat(messages, options);
  }
}
```

- [ ] **Step 8: Create LLM module**

Create `src/infrastructure/llm/llm.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIProvider } from './providers/openai.provider';
import { LlmService } from './llm.service';
import { TokenEstimatorService } from './token-estimator.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIProvider, LlmService, TokenEstimatorService],
  exports: [LlmService, TokenEstimatorService],
})
export class LlmModule {}
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(infrastructure): add LLM module with OpenAI provider and token estimator"
```

---

### Task 4: Embeddings Infrastructure Module

**Files:**
- Create: `src/infrastructure/embeddings/providers/openai-embedding.provider.ts`
- Create: `src/infrastructure/embeddings/embeddings.service.ts`
- Create: `src/infrastructure/embeddings/embeddings.module.ts`
- Modify: `src/modules/ingestion/ingestion.module.ts`
- Modify: `src/modules/ingestion/ingestion.pipeline.ts`
- Delete: `src/modules/ingestion/embeddings/openai-embeddings.ts`

- [ ] **Step 1: Create OpenAI embedding provider**

Create `src/infrastructure/embeddings/providers/openai-embedding.provider.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAIEmbeddings } from '@langchain/openai';
import { IEmbeddingProvider } from './embedding-provider.interface';

@Injectable()
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required');
    }

    this.embeddings = new OpenAIEmbeddings({
      apiKey,
      modelName: 'text-embedding-3-small',
      dimensions: 1536,
    });
  }

  async embed(text: string): Promise<number[]> {
    try {
      return await this.embeddings.embedQuery(text);
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    try {
      return await this.embeddings.embedDocuments(texts);
    } catch (error) {
      this.logger.error(
        `Failed to generate batch embeddings: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
```

- [ ] **Step 2: Create embeddings service facade**

Create `src/infrastructure/embeddings/embeddings.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { IEmbeddingProvider } from './providers/embedding-provider.interface';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';

@Injectable()
export class EmbeddingsService {
  private readonly provider: IEmbeddingProvider;

  constructor(private readonly openAIEmbeddingProvider: OpenAIEmbeddingProvider) {
    this.provider = this.openAIEmbeddingProvider;
  }

  async embed(text: string): Promise<number[]> {
    return this.provider.embed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.provider.embedBatch(texts);
  }
}
```

- [ ] **Step 3: Create embeddings module**

Create `src/infrastructure/embeddings/embeddings.module.ts`:

```typescript
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAIEmbeddingProvider } from './providers/openai-embedding.provider';
import { EmbeddingsService } from './embeddings.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [OpenAIEmbeddingProvider, EmbeddingsService],
  exports: [EmbeddingsService],
})
export class EmbeddingsModule {}
```

- [ ] **Step 4: Update ingestion pipeline to use EmbeddingsService**

Modify `src/modules/ingestion/ingestion.pipeline.ts`. Replace the import and usage of `OpenAIEmbeddingsService` with `EmbeddingsService`:

Change the import from:
```typescript
import { OpenAIEmbeddingsService } from './embeddings/openai-embeddings';
```
to:
```typescript
import { EmbeddingsService } from '../../infrastructure/embeddings/embeddings.service';
```

Change the constructor injection from:
```typescript
private readonly embeddings: OpenAIEmbeddingsService,
```
to:
```typescript
private readonly embeddings: EmbeddingsService,
```

Change the embedding generation call in `ingestDocument` from:
```typescript
const embeddingVectors = await this.embeddings.generate(chunkTexts);
```
to:
```typescript
const embeddingVectors = await this.embeddings.embedBatch(chunkTexts);
```

- [ ] **Step 5: Update ingestion module**

Modify `src/modules/ingestion/ingestion.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { IngestionPipeline } from './ingestion.pipeline';
import { DocumentCleaner } from './processors/document-cleaner';
import { TextChunker } from './chunking/text-chunker';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { EmbeddingsModule } from '../../infrastructure/embeddings/embeddings.module';

@Module({
  imports: [SupabaseModule, EmbeddingsModule],
  controllers: [IngestionController],
  providers: [
    IngestionService,
    IngestionPipeline,
    DocumentCleaner,
    TextChunker,
  ],
  exports: [IngestionService, IngestionPipeline],
})
export class IngestionModule {}
```

- [ ] **Step 6: Remove old embeddings file**

```bash
rm src/modules/ingestion/embeddings/openai-embeddings.ts
```

- [ ] **Step 7: Verify build compiles**

```bash
npx nest build
```

Expected: Compiles without errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(infrastructure): add embeddings module, refactor ingestion to use it"
```

---

### Task 5: Prompt Templates + Splitter Interface

**Files:**
- Create: `src/infrastructure/langchain/splitters/splitter.interface.ts`
- Create: `src/infrastructure/langchain/splitters/recursive-text-splitter.ts`
- Create: `src/infrastructure/langchain/prompts/system/default.md`
- Create: `src/infrastructure/langchain/prompts/rewrite/default.md`

- [ ] **Step 1: Create splitter interface**

Create `src/infrastructure/langchain/splitters/splitter.interface.ts`:

```typescript
export interface Chunk {
  content: string;
  index: number;
}

export interface ITextSplitter {
  split(text: string): Promise<Chunk[]>;
}
```

- [ ] **Step 2: Create recursive text splitter adapter**

Create `src/infrastructure/langchain/splitters/recursive-text-splitter.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { ITextSplitter, Chunk } from './splitter.interface';

@Injectable()
export class RecursiveTextSplitter implements ITextSplitter {
  private readonly chunkSize = 500;
  private readonly chunkOverlap = 80;

  async split(text: string): Promise<Chunk[]> {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: ['\n\n', '\n', ' ', ''],
      lengthFunction: (t: string): number => t.length,
    });

    const splitTexts = await splitter.splitText(text);
    return splitTexts.map((content, index) => ({ content, index }));
  }
}
```

- [ ] **Step 3: Create system prompt template**

Create `src/infrastructure/langchain/prompts/system/default.md`:

```markdown
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

- [ ] **Step 4: Create query rewrite prompt template**

Create `src/infrastructure/langchain/prompts/rewrite/default.md`:

```markdown
Given the conversation history, rewrite the user's question as a standalone
search query optimized for semantic retrieval.

Rules:
- Preserve the original meaning and intent
- Preserve all technical terminology exactly as written
- Resolve ambiguous references using conversation history
- Do NOT change the user's intent or add assumptions
- Optimize only for retrieval clarity
- Return ONLY the rewritten query, nothing else

History: {{conversation_history}}
Question: {{user_question}}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(infrastructure): add splitter interface and prompt templates"
```

---

### Task 6: RAG DTOs + Retriever Interface

**Files:**
- Create: `src/modules/rag/dto/rag-query.dto.ts`
- Create: `src/modules/rag/dto/rag-response.dto.ts`
- Create: `src/modules/rag/strategies/retriever.interface.ts`

- [ ] **Step 1: Create RAG query DTO**

Create `src/modules/rag/dto/rag-query.dto.ts`:

```typescript
import { IsString, IsOptional, IsInt, Min, Max, MinLength } from 'class-validator';

export class RagQueryDto {
  @IsString()
  @MinLength(1)
  question: string;

  @IsOptional()
  @IsString()
  session_id?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  top_k?: number = 5;
}
```

- [ ] **Step 2: Create RAG response DTO**

Create `src/modules/rag/dto/rag-response.dto.ts`:

```typescript
export interface SourceCitation {
  document_name: string;
  source_type: string;
  similarity: number;
  chunk_index: number;
}

export interface RagResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: string;
}
```

- [ ] **Step 3: Create retriever interface + shared types**

Create `src/modules/rag/strategies/retriever.interface.ts`:

```typescript
export interface RetrievalFilters {
  source_type?: string;
}

export interface RetrievedChunk {
  id: string;
  document_id: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

export type RetrievalConfidence = 'high' | 'medium' | 'low';

export interface ValidationResult {
  confidence: RetrievalConfidence;
  instruction: string;
}

export interface IRetrieverStrategy {
  retrieve(
    embedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<RetrievedChunk[]>;
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(rag): add DTOs, retriever interface, and shared types"
```

---

### Task 7: Vector Retriever

**Files:**
- Create: `src/modules/rag/strategies/vector-retriever.service.ts`
- Create: `src/modules/rag/strategies/vector-retriever.service.spec.ts`

- [ ] **Step 1: Write vector retriever test**

Create `src/modules/rag/strategies/vector-retriever.service.spec.ts`:

```typescript
import { VectorRetrieverService } from './vector-retriever.service';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';

describe('VectorRetrieverService', () => {
  let service: VectorRetrieverService;
  let mockSupabaseService: { getClient: jest.Mock };
  let mockRpc: jest.Mock;

  beforeEach(() => {
    mockRpc = jest.fn();
    mockSupabaseService = {
      getClient: jest.fn().mockReturnValue({ rpc: mockRpc }),
    };
    service = new VectorRetrieverService(
      mockSupabaseService as unknown as SupabaseService,
    );
  });

  it('should call match_documents RPC with correct params', async () => {
    const fakeEmbedding = [0.1, 0.2, 0.3];
    const fakeResults = [
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        content: 'test content',
        metadata: { type: 'markdown', source: 'doc.md' },
        similarity: 0.95,
      },
    ];
    mockRpc.mockResolvedValue({ data: fakeResults, error: null });

    const result = await service.retrieve(fakeEmbedding, {}, 5);

    expect(mockRpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: fakeEmbedding,
      match_count: 5,
      filter: {},
    });
    expect(result).toEqual([
      {
        id: 'chunk-1',
        document_id: 'doc-1',
        content: 'test content',
        metadata: { type: 'markdown', source: 'doc.md' },
        similarity: 0.95,
      },
    ]);
  });

  it('should apply source_type filter', async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });

    await service.retrieve([0.1], { source_type: 'pdf' }, 3);

    expect(mockRpc).toHaveBeenCalledWith('match_documents', {
      query_embedding: [0.1],
      match_count: 3,
      filter: { source_type: 'pdf' },
    });
  });

  it('should throw on Supabase error', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

    await expect(service.retrieve([0.1], {}, 5)).rejects.toThrow(
      'Vector search failed: RPC failed',
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/modules/rag/strategies/vector-retriever.service.spec.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement vector retriever**

Create `src/modules/rag/strategies/vector-retriever.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../infrastructure/supabase/supabase.service';
import { IRetrieverStrategy, RetrievedChunk, RetrievalFilters } from './retriever.interface';

@Injectable()
export class VectorRetrieverService implements IRetrieverStrategy {
  private readonly logger = new Logger(VectorRetrieverService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async retrieve(
    embedding: number[],
    filters: RetrievalFilters,
    topK: number,
  ): Promise<RetrievedChunk[]> {
    this.logger.debug(`Retrieving top ${topK} chunks`);

    const supabaseFilter: Record<string, string> = {};
    if (filters.source_type) {
      supabaseFilter.source_type = filters.source_type;
    }

    const { data, error } = await this.supabaseService
      .getClient()
      .rpc('match_documents', {
        query_embedding: embedding,
        match_count: topK,
        filter: supabaseFilter,
      });

    if (error) {
      this.logger.error(`Vector search failed: ${error.message}`);
      throw new Error(`Vector search failed: ${error.message}`);
    }

    this.logger.debug(`Retrieved ${(data as RetrievedChunk[]).length} chunks`);
    return data as RetrievedChunk[];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/modules/rag/strategies/vector-retriever.service.spec.ts --no-cache
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(rag): implement vector retriever with Supabase RPC"
```

---

### Task 8: Retrieval Filter + Validator

**Files:**
- Create: `src/modules/rag/retrieval-filter.service.ts`
- Create: `src/modules/rag/retrieval-validator.service.ts`
- Create: `src/modules/rag/retrieval-validator.service.spec.ts`

- [ ] **Step 1: Create retrieval filter service**

Create `src/modules/rag/retrieval-filter.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RetrievalFilters } from './strategies/retriever.interface';

export interface RetrievalFilterInput {
  source_type?: string;
}

@Injectable()
export class RetrievalFilterService {
  buildFilters(input: RetrievalFilterInput): RetrievalFilters {
    const filters: RetrievalFilters = {};

    if (input.source_type) {
      filters.source_type = input.source_type;
    }

    return filters;
  }
}
```

- [ ] **Step 2: Write retrieval validator test**

Create `src/modules/rag/retrieval-validator.service.spec.ts`:

```typescript
import { RetrievalValidatorService } from './retrieval-validator.service';
import { RetrievedChunk } from './strategies/retriever.interface';

describe('RetrievalValidatorService', () => {
  let service: RetrievalValidatorService;

  beforeEach(() => {
    service = new RetrievalValidatorService();
  });

  const makeChunk = (similarity: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: 'test content',
    metadata: {},
    similarity,
  });

  it('should return HIGH confidence when top score > 0.85 and 3+ chunks', () => {
    const chunks = [makeChunk(0.92), makeChunk(0.88), makeChunk(0.85)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('high');
    expect(result.instruction).toContain('Answer normally');
  });

  it('should return MEDIUM confidence when top score > 0.7 and 2+ chunks', () => {
    const chunks = [makeChunk(0.78), makeChunk(0.72)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('medium');
    expect(result.instruction).toContain('limited sources');
  });

  it('should return LOW confidence when top score < 0.7', () => {
    const chunks = [makeChunk(0.65)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('low');
    expect(result.instruction).toContain('cautiously');
  });

  it('should return LOW confidence when fewer than 2 chunks', () => {
    const chunks = [makeChunk(0.9)];
    const result = service.validate(chunks);
    expect(result.confidence).toBe('low');
  });

  it('should return LOW confidence for empty chunks', () => {
    const result = service.validate([]);
    expect(result.confidence).toBe('low');
    expect(result.instruction).toContain('no relevant information');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/modules/rag/retrieval-validator.service.spec.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement retrieval validator**

Create `src/modules/rag/retrieval-validator.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { RetrievedChunk, RetrievalConfidence, ValidationResult } from './strategies/retriever.interface';

@Injectable()
export class RetrievalValidatorService {
  private readonly logger = new Logger(RetrievalValidatorService.name);

  validate(chunks: RetrievedChunk[]): ValidationResult {
    if (chunks.length === 0) {
      this.logger.warn('No chunks retrieved');
      return {
        confidence: 'low',
        instruction: 'No relevant information was found. State that you could not find relevant information.',
      };
    }

    const topScore = chunks[0].similarity;

    if (topScore > 0.85 && chunks.length >= 3) {
      return {
        confidence: 'high',
        instruction: 'Answer normally with citations from the retrieved knowledge.',
      };
    }

    if (topScore > 0.7 && chunks.length >= 2) {
      return {
        confidence: 'medium',
        instruction: 'Answer but note that sources are limited. Be cautious about claims.',
      };
    }

    this.logger.warn(`Low retrieval confidence: top score=${topScore}, count=${chunks.length}`);
    return {
      confidence: 'low',
      instruction: 'Answer cautiously and state that the available information may be incomplete or not fully relevant.',
    };
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/modules/rag/retrieval-validator.service.spec.ts --no-cache
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rag): add retrieval filter and validator services"
```

---

### Task 9: Context Builder + Prompt Builder

**Files:**
- Create: `src/modules/rag/context-builder.service.ts`
- Create: `src/modules/rag/context-builder.service.spec.ts`
- Create: `src/modules/rag/prompt-builder.service.ts`

- [ ] **Step 1: Write context builder test**

Create `src/modules/rag/context-builder.service.spec.ts`:

```typescript
import { ContextBuilderService } from './context-builder.service';
import { RetrievedChunk } from './strategies/retriever.interface';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

describe('ContextBuilderService', () => {
  let service: ContextBuilderService;
  let tokenEstimator: TokenEstimatorService;

  beforeEach(() => {
    tokenEstimator = new TokenEstimatorService();
    service = new ContextBuilderService(tokenEstimator);
  });

  const makeChunk = (name: string, similarity: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: `Content from ${name}`,
    metadata: { type: 'markdown', source: name },
    similarity,
  });

  describe('buildContext', () => {
    it('should assemble context with all sections', () => {
      const chunks = [makeChunk('doc1.md', 0.9)];
      const history: ChatMessage[] = [
        { role: 'user', content: 'previous question' },
        { role: 'assistant', content: 'previous answer' },
      ];

      const result = service.buildContext({
        systemPrompt: 'You are an assistant.',
        chunks,
        history,
        confidenceInstruction: 'Answer normally.',
        userQuestion: 'What is this?',
      });

      expect(result).toContain('=== SYSTEM INSTRUCTIONS ===');
      expect(result).toContain('=== CONVERSATION HISTORY ===');
      expect(result).toContain('=== RETRIEVED KNOWLEDGE ===');
      expect(result).toContain('=== RETRIEVAL CONFIDENCE ===');
      expect(result).toContain('=== USER QUESTION ===');
      expect(result).toContain('You are an assistant.');
      expect(result).toContain('Content from doc1.md');
      expect(result).toContain('What is this?');
    });

    it('should include chunk metadata in formatting', () => {
      const chunks = [makeChunk('test.md', 0.92)];

      const result = service.buildContext({
        systemPrompt: 'test',
        chunks,
        history: [],
        confidenceInstruction: '',
        userQuestion: 'question',
      });

      expect(result).toContain('Document: test.md');
      expect(result).toContain('Similarity: 0.92');
    });

    it('should handle empty chunks gracefully', () => {
      const result = service.buildContext({
        systemPrompt: 'test',
        chunks: [],
        history: [],
        confidenceInstruction: '',
        userQuestion: 'question',
      });

      expect(result).toContain('No relevant documents were found.');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx jest src/modules/rag/context-builder.service.spec.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement context builder**

Create `src/modules/rag/context-builder.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './strategies/retriever.interface';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';

export interface ContextInput {
  systemPrompt: string;
  chunks: RetrievedChunk[];
  history: ChatMessage[];
  confidenceInstruction: string;
  userQuestion: string;
}

export interface TokenBudgetConfig {
  systemPromptBudget: number;
  historyBudget: number;
  chunksBudget: number;
}

@Injectable()
export class ContextBuilderService {
  private readonly defaultBudget: TokenBudgetConfig = {
    systemPromptBudget: 300,
    historyBudget: 800,
    chunksBudget: 2500,
  };

  constructor(private readonly tokenEstimator: TokenEstimatorService) {}

  buildContext(input: ContextInput): string {
    const sections: string[] = [];

    // System instructions
    sections.push('=== SYSTEM INSTRUCTIONS ===');
    sections.push(input.systemPrompt);
    if (input.confidenceInstruction) {
      sections.push(input.confidenceInstruction);
    }

    // Conversation history
    sections.push('=== CONVERSATION HISTORY ===');
    if (input.history.length === 0) {
      sections.push('(No prior conversation)');
    } else {
      const trimmedHistory = this.trimToBudget(
        input.history.map((m) => `${m.role}: ${m.content}`),
        this.defaultBudget.historyBudget,
      );
      sections.push(trimmedHistory.join('\n'));
    }

    // Retrieved knowledge
    sections.push('=== RETRIEVED KNOWLEDGE ===');
    if (input.chunks.length === 0) {
      sections.push('No relevant documents were found.');
    } else {
      const chunkSections = this.formatChunks(input.chunks);
      const trimmedChunks = this.trimToBudget(chunkSections, this.defaultBudget.chunksBudget);
      sections.push(trimmedChunks.join('\n'));
    }

    // Retrieval confidence
    sections.push('=== RETRIEVAL CONFIDENCE ===');
    sections.push(input.confidenceInstruction ? 'See instructions above.' : 'Not specified.');

    // User question
    sections.push('=== USER QUESTION ===');
    sections.push(input.userQuestion);

    return sections.join('\n\n');
  }

  private formatChunks(chunks: RetrievedChunk[]): string[] {
    return chunks.map((chunk) => {
      const docName = (chunk.metadata.source as string) || (chunk.metadata.fileName as string) || 'Unknown';
      const sourceType = (chunk.metadata.type as string) || 'unknown';
      return [
        `[Source]`,
        `Document: ${docName}`,
        `Type: ${sourceType}`,
        `Similarity: ${chunk.similarity.toFixed(4)}`,
        ``,
        `Content:`,
        chunk.content,
        `---`,
      ].join('\n');
    });
  }

  private trimToBudget(items: string[], budget: number): string[] {
    const result: string[] = [];
    let usedTokens = 0;

    for (const item of items) {
      const tokens = this.tokenEstimator.estimateTokens(item);
      if (usedTokens + tokens > budget) break;
      result.push(item);
      usedTokens += tokens;
    }

    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx jest src/modules/rag/context-builder.service.spec.ts --no-cache
```

Expected: PASS.

- [ ] **Step 5: Implement prompt builder**

Create `src/modules/rag/prompt-builder.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

@Injectable()
export class PromptBuilderService {
  private readonly logger = new Logger(PromptBuilderService.name);

  buildMessages(systemPrompt: string, context: string, userQuestion: string): ChatMessage[] {
    const messages: ChatMessage[] = [];

    messages.push({
      role: 'system',
      content: `${systemPrompt}\n\n${context}`,
    });

    messages.push({
      role: 'user',
      content: userQuestion,
    });

    return messages;
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rag): add context builder with token budgeting and prompt builder"
```

---

### Task 10: Query Rewriter + Citation Service

**Files:**
- Create: `src/modules/rag/query-rewriter.service.ts`
- Create: `src/modules/rag/citation.service.ts`
- Create: `src/modules/rag/citation.service.spec.ts`

- [ ] **Step 1: Create query rewriter service**

Create `src/modules/rag/query-rewriter.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

@Injectable()
export class QueryRewriterService {
  private readonly logger = new Logger(QueryRewriterService.name);
  private readonly rewritePromptTemplate: string;

  constructor(private readonly llmService: LlmService) {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'infrastructure',
      'langchain',
      'prompts',
      'rewrite',
      'default.md',
    );
    this.rewritePromptTemplate = fs.readFileSync(templatePath, 'utf-8');
  }

  async rewrite(question: string, history: ChatMessage[]): Promise<string> {
    const historyText = history
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const prompt = this.rewritePromptTemplate
      .replace('{{conversation_history}}', historyText || '(No prior conversation)')
      .replace('{{user_question}}', question);

    const messages: ChatMessage[] = [{ role: 'user', content: prompt }];

    try {
      const response = await this.llmService.chat(messages, {
        temperature: 0.2,
        maxTokens: 200,
      });
      this.logger.debug(`Rewrote query: "${question}" → "${response.content.trim()}"`);
      return response.content.trim();
    } catch (error) {
      this.logger.warn(
        `Query rewrite failed, using original: ${error instanceof Error ? error.message : String(error)}`,
      );
      return question;
    }
  }
}
```

- [ ] **Step 2: Write citation service test**

Create `src/modules/rag/citation.service.spec.ts`:

```typescript
import { CitationService } from './citation.service';
import { RetrievedChunk } from './strategies/retriever.interface';
import { SourceCitation } from './dto/rag-response.dto';

describe('CitationService', () => {
  let service: CitationService;

  beforeEach(() => {
    service = new CitationService();
  });

  const makeChunk = (source: string, type: string, similarity: number, chunkIndex: number): RetrievedChunk => ({
    id: 'chunk-id',
    document_id: 'doc-id',
    content: 'content',
    metadata: { source, type, chunkIndex },
    similarity,
  });

  describe('formatCitations', () => {
    it('should format chunks into source citations', () => {
      const chunks = [makeChunk('doc1.md', 'markdown', 0.9, 0)];
      const result = service.formatCitations(chunks);
      expect(result).toEqual([
        {
          document_name: 'doc1.md',
          source_type: 'markdown',
          similarity: 0.9,
          chunk_index: 0,
        },
      ]);
    });

    it('should deduplicate citations by document name', () => {
      const chunks = [
        makeChunk('doc1.md', 'markdown', 0.9, 0),
        makeChunk('doc1.md', 'markdown', 0.85, 1),
        makeChunk('doc2.md', 'pdf', 0.8, 0),
      ];
      const result = service.formatCitations(chunks);
      expect(result).toHaveLength(2);
      expect(result[0].document_name).toBe('doc1.md');
      expect(result[1].document_name).toBe('doc2.md');
    });

    it('should return empty array for empty chunks', () => {
      expect(service.formatCitations([])).toEqual([]);
    });
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

```bash
npx jest src/modules/rag/citation.service.spec.ts --no-cache
```

Expected: FAIL — module not found.

- [ ] **Step 4: Implement citation service**

Create `src/modules/rag/citation.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from './strategies/retriever.interface';
import { SourceCitation } from './dto/rag-response.dto';

@Injectable()
export class CitationService {
  formatCitations(chunks: RetrievedChunk[]): SourceCitation[] {
    if (chunks.length === 0) return [];

    const seen = new Set<string>();
    const citations: SourceCitation[] = [];

    for (const chunk of chunks) {
      const docName = (chunk.metadata.source as string) || (chunk.metadata.fileName as string) || 'Unknown';
      if (seen.has(docName)) continue;
      seen.add(docName);

      citations.push({
        document_name: docName,
        source_type: (chunk.metadata.type as string) || 'unknown',
        similarity: chunk.similarity,
        chunk_index: (chunk.metadata.chunkIndex as number) ?? 0,
      });
    }

    return citations;
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx jest src/modules/rag/citation.service.spec.ts --no-cache
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(rag): add query rewriter and citation service"
```

---

### Task 11: RAG Pipeline Orchestrator + Module

**Files:**
- Create: `src/modules/rag/rag-pipeline.service.ts`
- Create: `src/modules/rag/rag.module.ts`

- [ ] **Step 1: Create RAG pipeline service**

Create `src/modules/rag/rag-pipeline.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { TokenEstimatorService } from '../../infrastructure/llm/token-estimator.service';
import { EmbeddingsService } from '../../infrastructure/embeddings/embeddings.service';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';
import { QueryRewriterService } from './query-rewriter.service';
import { RetrievalFilterService } from './retrieval-filter.service';
import { RetrievalValidatorService } from './retrieval-validator.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationService } from './citation.service';
import { VectorRetrieverService } from './strategies/vector-retriever.service';
import { RetrievedChunk, RetrievalConfidence } from './strategies/retriever.interface';
import { SourceCitation } from './dto/rag-response.dto';

export interface PipelineInput {
  question: string;
  history: ChatMessage[];
  topK?: number;
}

export interface PipelineOutput {
  answer: string;
  sources: SourceCitation[];
  tokensUsed: number;
  retrievalConfidence: RetrievalConfidence;
  metrics: Record<string, number>;
}

@Injectable()
export class RagPipelineService {
  private readonly logger = new Logger(RagPipelineService.name);
  private readonly systemPrompt: string;

  constructor(
    private readonly queryRewriter: QueryRewriterService,
    private readonly embeddingsService: EmbeddingsService,
    private readonly retrievalFilter: RetrievalFilterService,
    private readonly retriever: VectorRetrieverService,
    private readonly retrievalValidator: RetrievalValidatorService,
    private readonly contextBuilder: ContextBuilderService,
    private readonly promptBuilder: PromptBuilderService,
    private readonly citationService: CitationService,
    private readonly llmService: LlmService,
    private readonly tokenEstimator: TokenEstimatorService,
  ) {
    const promptPath = path.join(
      __dirname,
      '..',
      '..',
      'infrastructure',
      'langchain',
      'prompts',
      'system',
      'default.md',
    );
    this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');
  }

  async query(input: PipelineInput): Promise<PipelineOutput> {
    const metrics: Record<string, number> = {};
    const totalStart = Date.now();

    // Step a: Query rewrite
    const rewriteStart = Date.now();
    const rewrittenQuery = await this.queryRewriter.rewrite(
      input.question,
      input.history,
    );
    metrics.query_rewrite_ms = Date.now() - rewriteStart;

    // Step b: Embed the rewritten query
    const embedStart = Date.now();
    const embedding = await this.embeddingsService.embed(rewrittenQuery);
    metrics.embedding_ms = Date.now() - embedStart;

    // Step c-d: Build filters and retrieve
    const filters = this.retrievalFilter.buildFilters({});
    const retrievalStart = Date.now();
    let chunks: RetrievedChunk[];
    try {
      chunks = await this.retriever.retrieve(embedding, filters, input.topK || 5);
    } catch (error) {
      this.logger.error(`Retrieval failed: ${error instanceof Error ? error.message : String(error)}`);
      chunks = [];
    }
    metrics.retrieval_ms = Date.now() - retrievalStart;

    // Step e: Validate retrieval
    const validation = this.retrievalValidator.validate(chunks);

    // Step f: Build context
    const context = this.contextBuilder.buildContext({
      systemPrompt: this.systemPrompt,
      chunks,
      history: input.history,
      confidenceInstruction: validation.instruction,
      userQuestion: input.question,
    });

    // Step g: Build prompt messages
    const messages = this.promptBuilder.buildMessages(
      this.systemPrompt,
      context,
      input.question,
    );

    // Step h: LLM completion
    const llmStart = Date.now();
    const llmResponse = await this.llmService.chat(messages, {
      temperature: 0.3,
    });
    metrics.llm_ms = Date.now() - llmStart;

    // Step i: Format citations
    const sources = this.citationService.formatCitations(chunks);

    metrics.total_ms = Date.now() - totalStart;

    this.logger.log(
      `Pipeline complete: confidence=${validation.confidence}, chunks=${chunks.length}, tokens=${llmResponse.tokensUsed.total}, total_ms=${metrics.total_ms}`,
    );

    return {
      answer: llmResponse.content,
      sources,
      tokensUsed: llmResponse.tokensUsed.total,
      retrievalConfidence: validation.confidence,
      metrics,
    };
  }
}
```

- [ ] **Step 2: Create RAG module**

Create `src/modules/rag/rag.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { RagPipelineService } from './rag-pipeline.service';
import { QueryRewriterService } from './query-rewriter.service';
import { RetrievalFilterService } from './retrieval-filter.service';
import { RetrievalValidatorService } from './retrieval-validator.service';
import { ContextBuilderService } from './context-builder.service';
import { PromptBuilderService } from './prompt-builder.service';
import { CitationService } from './citation.service';
import { VectorRetrieverService } from './strategies/vector-retriever.service';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { LlmModule } from '../../infrastructure/llm/llm.module';
import { EmbeddingsModule } from '../../infrastructure/embeddings/embeddings.module';

@Module({
  imports: [SupabaseModule, LlmModule, EmbeddingsModule],
  providers: [
    RagPipelineService,
    QueryRewriterService,
    RetrievalFilterService,
    RetrievalValidatorService,
    ContextBuilderService,
    PromptBuilderService,
    CitationService,
    VectorRetrieverService,
  ],
  exports: [RagPipelineService],
})
export class RagModule {}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat(rag): add pipeline orchestrator and RAG module"
```

---

### Task 12: Chat Module Rewrite + App Wiring

**Files:**
- Modify: `src/modules/chat/dto/chat-message.dto.ts`
- Modify: `src/modules/chat/dto/chat-response.dto.ts`
- Modify: `src/modules/chat/chat.service.ts`
- Modify: `src/modules/chat/chat.controller.ts`
- Modify: `src/modules/chat/chat.module.ts`
- Modify: `src/app.module.ts`

- [ ] **Step 1: Update chat message DTO**

Replace the contents of `src/modules/chat/dto/chat-message.dto.ts`:

```typescript
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  session_id?: string;
}
```

- [ ] **Step 2: Update chat response DTO**

Replace the contents of `src/modules/chat/dto/chat-response.dto.ts`:

```typescript
import { SourceCitation } from '../../rag/dto/rag-response.dto';

export class ChatResponseDto {
  answer: string;
  sources: SourceCitation[];
  session_id: string;
  tokens_used: number;
  retrieval_confidence: string;
}
```

- [ ] **Step 3: Rewrite chat service**

Replace the contents of `src/modules/chat/chat.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service';
import { RagPipelineService } from '../rag/rag-pipeline.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';
import { ChatMessage } from '../../infrastructure/llm/providers/llm-provider.interface';

interface SessionRow {
  id: string;
  title: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: string;
  session_id: string;
  role: string;
  content: string;
  sources: Record<string, unknown>[] | null;
  metadata: Record<string, unknown>;
  tokens_used: number | null;
  created_at: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly ragPipeline: RagPipelineService,
  ) {}

  async handleMessage(dto: ChatMessageDto): Promise<ChatResponseDto> {
    const supabase = this.supabaseService.getClient();

    // 1. Get or create session
    let sessionId = dto.session_id;
    if (!sessionId) {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ title: dto.message.slice(0, 50) })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create session: ${error.message}`);
      }
      sessionId = (data as SessionRow).id;
    }

    // 2. Store user message
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'user',
      content: dto.message,
    });

    // 3. Load recent message history (last 10)
    const { data: historyData } = await supabase
      .from('messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(10);

    const history: ChatMessage[] = (
      (historyData as Pick<MessageRow, 'role' | 'content'>[] || [])
    )
      .reverse()
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    // 4. Run RAG pipeline
    const pipelineResult = await this.ragPipeline.query({
      question: dto.message,
      history,
      topK: 5,
    });

    // 5. Store assistant response
    await supabase.from('messages').insert({
      session_id: sessionId,
      role: 'assistant',
      content: pipelineResult.answer,
      sources: pipelineResult.sources as unknown as Record<string, unknown>[],
      tokens_used: pipelineResult.tokensUsed,
      metadata: {
        pipeline_metrics: pipelineResult.metrics,
        retrieval_confidence: pipelineResult.retrievalConfidence,
      },
    });

    // 6. Return response
    return {
      answer: pipelineResult.answer,
      sources: pipelineResult.sources,
      session_id: sessionId,
      tokens_used: pipelineResult.tokensUsed,
      retrieval_confidence: pipelineResult.retrievalConfidence,
    };
  }
}
```

- [ ] **Step 4: Update chat controller**

Replace the contents of `src/modules/chat/chat.controller.ts`:

```typescript
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { ChatResponseDto } from './dto/chat-response.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Body() chatMessageDto: ChatMessageDto,
  ): Promise<ChatResponseDto> {
    return this.chatService.handleMessage(chatMessageDto);
  }
}
```

- [ ] **Step 5: Update chat module**

Replace the contents of `src/modules/chat/chat.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { SupabaseModule } from '../../infrastructure/supabase/supabase.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [SupabaseModule, RagModule],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
```

- [ ] **Step 6: Update app module**

Replace the contents of `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentsModule } from './modules/documents/documents.module';
import { ChatModule } from './modules/chat/chat.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';
import { CommonModule } from './modules/common/common.module';
import { SupabaseModule } from './infrastructure/supabase/supabase.module';
import { LlmModule } from './infrastructure/llm/llm.module';
import { EmbeddingsModule } from './infrastructure/embeddings/embeddings.module';
import { RagModule } from './modules/rag/rag.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SupabaseModule,
    LlmModule,
    EmbeddingsModule,
    DocumentsModule,
    ChatModule,
    IngestionModule,
    CommonModule,
    RagModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

- [ ] **Step 7: Build and verify**

```bash
npx nest build
```

Expected: Compiles without errors.

- [ ] **Step 8: Run all tests**

```bash
npx jest --no-cache
```

Expected: All tests pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(chat): rewrite chat module with RAG pipeline integration"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] Module structure (Section 2) → Tasks 2-6, 8-11
- [x] Database changes (Section 3) → Task 1
- [x] Pipeline flow (Section 4) → Task 11
- [x] Retrieval strategy (Section 5) → Tasks 6-7
- [x] Context window strategy (Section 6) → Task 9
- [x] Prompt templates (Section 7) → Tasks 5, 10
- [x] Provider abstraction (Section 8) → Tasks 2-4
- [x] Failure handling (Section 9) → Task 11 (graceful fallback in pipeline)
- [x] Observability (Section 10) → Task 12 (metadata stored in messages)

**2. Placeholder scan:** No TBDs, TODOs, or vague instructions found.

**3. Type consistency:** All interfaces, DTOs, and method signatures verified across tasks. `RetrievedChunk`, `ChatMessage`, `SourceCitation`, `RetrievalConfidence` used consistently.
