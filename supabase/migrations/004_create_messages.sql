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