# Incident Report — Data Migration Failure

**Date:** 2025-01-28
**Severity:** P2 (High)
**Duration:** 2 hours (10:00 — 12:00 UTC)
**Incident Commander:** Alice Chen

## Timeline
- 10:00 — Scheduled migration started: adding chunk_index column to document_chunks
- 10:15 — Migration failed: column already existed in some environments
- 10:30 — Rollback initiated
- 10:45 — Rollback completed, service restored
- 11:00 — Root cause: migration was partially applied in staging
- 11:30 — Fix: Added IF NOT EXISTS clause to migration
- 12:00 — Migration re-run successfully

## Root Cause
The migration script did not account for partial application in the staging environment. The chunk_index column was already added manually during development but the migration script did not check for existence.

## Fix Applied
- Added IF NOT EXISTS clause to all ALTER TABLE statements
- Added pre-migration validation script
- Updated migration documentation with checklist

## Lessons Learned
- Always use IF NOT EXISTS in migration scripts
- Test migrations against a copy of production data
- Never manually modify database schema outside of migrations
