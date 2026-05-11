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