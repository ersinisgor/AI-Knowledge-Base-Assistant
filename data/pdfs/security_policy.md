# Security Policy — TechNova Solutions

Version: 3.0 | Last Updated: 2025-01-01 | Owner: Security Team

---

## Authentication Rules

- JWT tokens must be verified on every request using the `AuthGuard` middleware
- Tokens must be signed using RS256 (asymmetric algorithm — never HS256)
- Access tokens expire in 15 minutes; refresh tokens expire in 7 days
- Refresh token rotation is mandatory: reuse of an old refresh token must immediately invalidate the entire session

## Password Policy

- Minimum 8 characters
- Must include at least one uppercase letter and one number
- Passwords are hashed using bcrypt (minimum 12 rounds)
- Password reset links expire after 1 hour
- Users must not reuse their last 5 passwords

## API Security

- Rate limiting is enabled on all public endpoints: 100 requests per minute per IP
- After 5 consecutive failed login attempts, the account is locked for 15 minutes
- All API requests must use HTTPS — HTTP is rejected at the load balancer
- CORS is restricted to known frontend origins only
- All inputs are validated and sanitized before processing

## Data Protection

- All data at rest is encrypted using AES-256
- All data in transit is encrypted using TLS 1.2 or higher
- Personally identifiable information (PII) is never logged
- Database backups are encrypted and retained for 30 days

## Vulnerability Management

- Dependencies are scanned weekly using Snyk
- Critical vulnerabilities must be patched within 48 hours
- High vulnerabilities must be patched within 7 days
- All engineers must complete security training annually

## Incident Handling

- All security incidents must be reported within 24 hours of discovery
- P1 security incidents require immediate escalation to the CTO
- A post-mortem is mandatory for any breach or data exposure event
- Incident reports are stored in the `#security-incidents` Slack channel and the internal incident tracker
