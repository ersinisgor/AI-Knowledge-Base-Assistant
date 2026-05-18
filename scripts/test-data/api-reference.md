# API Reference — TechNova Solutions

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
Health check endpoint. Returns status of API, database, and AI services.
