# Database Schema — TechNova Solutions

## Tables

### users
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique email |
| password_hash | VARCHAR(255) | Bcrypt hashed password |
| role | VARCHAR(50) | admin, engineer, manager, viewer |
| created_at | TIMESTAMPTZ | Account creation date |
| updated_at | TIMESTAMPTZ | Last profile update |

### documents
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| content | TEXT | Original document content |
| source_type | VARCHAR(50) | pdf, markdown, slack, github |
| metadata | JSONB | Arbitrary metadata (fileName, department, etc.) |
| created_at | TIMESTAMPTZ | Ingestion timestamp |

### document_chunks
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | Foreign key to documents |
| content | TEXT | Chunk text (max ~500 chars) |
| embedding | VECTOR(1536) | OpenAI text-embedding-3-small |
| metadata | JSONB | Chunk-level metadata |
| chunk_index | INTEGER | Position in original document |
| created_at | TIMESTAMPTZ | Creation timestamp |

### chat_sessions
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users |
| title | TEXT | Auto-generated from first message |
| metadata | JSONB | Session metadata |
| created_at | TIMESTAMPTZ | Session start |
| updated_at | TIMESTAMPTZ | Last activity |

### messages
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to chat_sessions |
| role | VARCHAR(20) | system, user, assistant, tool |
| content | TEXT | Message text |
| sources | JSONB | Citation data |
| metadata | JSONB | Pipeline metrics |
| tokens_used | INTEGER | Token count |
| created_at | TIMESTAMPTZ | Message timestamp |

## Indexes
- document_chunks: HNSW index on embedding column for fast cosine similarity
- messages: B-tree index on session_id for fast conversation retrieval
- documents: B-tree index on source_type for filtering
