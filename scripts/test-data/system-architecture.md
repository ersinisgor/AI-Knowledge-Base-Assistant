# System Architecture — TechNova Solutions

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
- Automatic reconnection handling
