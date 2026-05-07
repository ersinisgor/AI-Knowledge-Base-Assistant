-- Create documents table for storing original document content
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('pdf', 'markdown', 'slack', 'github')),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE documents IS 'Stores original document content and metadata';
COMMENT ON COLUMN documents.source_type IS 'Type of document source: pdf, markdown, slack, or github';

-- Create index on created_at for sorting by date
CREATE INDEX IF NOT EXISTS documents_created_at_idx
ON documents(created_at DESC);

-- Create index on source_type for filtering
CREATE INDEX IF NOT EXISTS documents_source_type_idx
ON documents(source_type);
