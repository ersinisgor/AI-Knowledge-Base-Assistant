# Backend Guidelines — TechNova Solutions

## Module Structure Rules
- Use DTOs for all input validation
- Separate controller / service / repository layers
- Never access the database directly from a controller
- Each module should be self-contained with its own imports

## DTOs
- All DTOs must use class-validator decorators
- Use class-transformer for response serialization
- Document all fields with @ApiProperty for Swagger

## Error Handling
- Use NestJS global exception filter
- Return consistent error format:
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
  }
- Log all errors with structured logging (JSON)
- Never expose stack traces in production

## Logging
- Use structured logging (JSON format)
- Log levels: error, warn, info, debug
- Include requestId in all log entries
- Log all critical operations (auth, data mutations)
- Use correlation IDs for distributed tracing

## Testing
- Unit tests for all services (Jest)
- Integration tests for API endpoints (Supertest)
- Minimum 80% code coverage
- Test files co-located: service.spec.ts next to service.ts
- Use describe/it blocks with clear test descriptions

## Git Conventions
- Branch naming: feature/name, fix/name, refactor/name
- Commit format: type(scope): description
- Types: feat, fix, refactor, docs, test, chore
- PRs require 2 approvals and passing CI

## Database
- Use migrations for all schema changes
- Never modify schema manually in production
- Use parameterized queries (no string interpolation)
- Index frequently queried columns
- Use JSONB for flexible metadata storage
