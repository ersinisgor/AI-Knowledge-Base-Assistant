-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create document_chunks table for storing text chunks with embeddings
-- This table stores processed chunks from documents, each with its embedding vector
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create HNSW index for fast cosine similarity search on embeddings
-- This enables efficient vector search for RAG retrieval
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
ON document_chunks
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Create index on document_id for faster JOIN queries
CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx
ON document_chunks(document_id);

-- Add comment for documentation
COMMENT ON TABLE document_chunks IS 'Stores text chunks with embeddings for semantic search';
COMMENT ON COLUMN document_chunks.embedding IS 'Vector embedding (1536 dimensions) from OpenAI text-embedding-3-small';
COMMENT ON COLUMN document_chunks.metadata IS 'Metadata including source, type, fileName, chunkIndex, documentId';
