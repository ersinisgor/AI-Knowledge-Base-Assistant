# Incident Report — API Downtime

**Date:** 2025-02-01
**Severity:** P1 (Critical)
**Duration:** 45 minutes (14:00 — 14:45 UTC)
**Incident Commander:** Bob Martinez

## Timeline
- 14:00 — Alert triggered: API response time exceeded 5 seconds
- 14:05 — Multiple users reported 503 errors
- 14:10 — Investigation started. Database connections were piling up.
- 14:15 — Root cause identified: Database connection pool exhausted
- 14:20 — Emergency fix: Restarted application servers to reset connections
- 14:30 — Connection pool size increased from 10 to 30
- 14:35 — Added connection monitoring and alerting
- 14:45 — Full service restored. All endpoints responding normally.

## Root Cause
The database connection pool was set to 10 connections. During peak hours, the application needed more than 10 concurrent connections, causing new requests to queue and eventually timeout.

## Fix Applied
- Increased pool size from 10 to 30 connections
- Added connection pool monitoring dashboard in Grafana
- Configured alerting when pool utilization exceeds 80%
- Added connection timeout: 5 seconds max wait for available connection

## Prevention
- Load testing before deployment to validate pool sizing
- Auto-scaling rules for connection pool based on traffic patterns
- Regular review of database connection metrics
- Improved load testing to simulate peak traffic scenarios

## Lessons Learned
- Connection pool sizing should be based on load testing, not estimates
- Monitoring should include connection pool utilization metrics
- Need faster incident response process for P1 incidents
