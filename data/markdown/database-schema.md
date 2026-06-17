# Database Schema — TechNova Solutions

All tables live in a single PostgreSQL database hosted on Supabase.

---

## users

Stores registered user accounts.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key, `gen_random_uuid()` |
| email | text | Unique, not null |
| password_hash | text | bcrypt, 12 rounds |
| full_name | text | |
| role | text | `admin`, `engineer`, `viewer` |
| created_at | timestamptz | Default: `now()` |
| last_login_at | timestamptz | Updated on each successful login |

---

## documents

Stores ingested documents (source content).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| content | text | Full document text |
| source_type | text | `pdf`, `markdown`, `slack`, `github` |
| metadata | jsonb | fileName, author, tags, etc. |
| created_at | timestamptz | |

---

## document_chunks

Stores text chunks with vector embeddings for similarity search.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| document_id | uuid | FK → documents(id), CASCADE DELETE |
| content | text | Chunk text (500 chars target) |
| embedding | vector(1536) | OpenAI text-embedding-3-small |
| metadata | jsonb | chunk_index, source_type, etc. |
| chunk_index | integer | Position in original document |
| created_at | timestamptz | |

Indexed with HNSW (`m=16, ef_construction=64`) for fast cosine similarity search.

---

## chat_sessions

Stores user chat sessions with the AI assistant.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK → users(id), nullable for anonymous |
| title | text | Auto-generated from first message |
| metadata | jsonb | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

---

## messages

Stores individual messages within a chat session.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| session_id | uuid | FK → chat_sessions(id), CASCADE DELETE |
| role | text | `user`, `assistant` |
| content | text | Message text |
| sources | jsonb | Array of source citations |
| metadata | jsonb | tokens_used, latency_ms, confidence |
| tokens_used | integer | |
| created_at | timestamptz | |

---

## github_commits

Stores ingested GitHub commit history.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| commit_hash | text | Short hash (7 chars) |
| message | text | Commit message |
| author | text | GitHub username |
| date | date | Commit date |
| files_changed | jsonb | List of modified files |
| created_at | timestamptz | |

---

## Indexes

- `document_chunks.embedding` — HNSW index (cosine) for vector similarity search
- `documents.created_at` — B-tree index for chronological listing
- `messages.session_id` — B-tree index for session-scoped queries
- `users.email` — Unique B-tree index
