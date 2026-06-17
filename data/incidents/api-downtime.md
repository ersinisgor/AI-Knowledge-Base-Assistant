# Incident Report — API Downtime

**Incident ID:** INC-2025-001
**Date:** 2025-02-01
**Duration:** 45 minutes (14:15 – 15:00 UTC)
**Severity:** P1
**Status:** Resolved
**On-call Engineer:** Dave (backend)

---

## Summary

The API was completely unavailable for 45 minutes due to database connection pool exhaustion during peak traffic hours.

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| 14:15 | First alert fired — API error rate > 50% |
| 14:17 | Dave acknowledged the PagerDuty alert |
| 14:25 | Root cause identified: connection pool exhausted |
| 14:40 | Pool size increased from 10 to 30 in production |
| 14:55 | Error rate returned to 0% |
| 15:00 | Incident marked resolved |

---

## Root Cause

The database connection pool was configured with a maximum of 10 connections. A traffic spike caused all 10 connections to be held by slow queries in the AI ingestion pipeline. New API requests could not obtain a connection and failed immediately.

The AI ingestion pipeline does not currently time out slow queries, which allowed connections to be held indefinitely.

---

## Impact

- 100% of API requests failed for 45 minutes
- Approximately 1,200 users were affected
- No data was lost or corrupted

---

## Fix Applied

- Increased database connection pool size from 10 to 30
- Added explicit 5-second query timeout to the AI ingestion pipeline
- Added Datadog monitoring alert: fires when pool utilization exceeds 80%

---

## Prevention Actions

- [ ] Add load testing to CI pipeline to catch connection pool issues before deployment
- [ ] Implement circuit breaker pattern for AI ingestion pipeline
- [ ] Review all slow queries and add indexes where missing
- [ ] Add runbook to on-call documentation for connection pool issues

---

## Lessons Learned

- The ingestion pipeline must have strict timeouts — a slow external call (OpenAI embedding) can hold a DB connection for seconds
- Pool size must be validated as part of infrastructure review, not just after an incident
- Alerting threshold of 80% pool utilization would have given us 15-minute warning before this incident
