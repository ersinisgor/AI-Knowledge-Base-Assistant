# Backend Development Guidelines — TechNova Solutions

## Module Structure

Every feature must live in its own NestJS module. A standard module includes:

```
feature/
  feature.module.ts
  feature.controller.ts
  feature.service.ts
  feature.repository.ts
  dto/
    create-feature.dto.ts
    update-feature.dto.ts
  entities/
    feature.entity.ts
```

## Rules

- Use DTOs with `class-validator` decorators for all controller inputs — never access `req.body` directly
- Separate controller / service / repository layers — never put business logic in a controller
- Never access the database directly from a controller or service — use the repository pattern
- Use dependency injection (constructor injection) for all dependencies
- Mark injectable classes with `@Injectable()`

## Error Handling

- Use a global exception filter (`AllExceptionsFilter`) to catch unhandled errors
- Return consistent error format for all failures:
  ```json
  {
    "statusCode": 400,
    "message": "Validation failed",
    "error": "Bad Request"
  }
  ```
- Throw NestJS built-in exceptions (`BadRequestException`, `NotFoundException`, etc.) from services
- Never expose raw database errors or stack traces to the client

## Logging

- Use structured logging with Winston
- Every log entry must include: `timestamp`, `level`, `service`, `correlationId`, `message`
- Log all critical operations: auth events, payment events, AI responses
- Never log PII (passwords, tokens, email addresses)
- Log levels: `debug` (development only), `info` (normal ops), `warn` (degraded state), `error` (failures)

## Testing

- Write unit tests for all service methods using Jest
- Mock all external dependencies (database, OpenAI, etc.) in unit tests
- Write integration tests for all controller endpoints using `supertest`
- Minimum coverage target: 80% for services, 60% for controllers
- Test file naming: `feature.service.spec.ts`

## Database Access

- All Supabase queries must handle errors explicitly — check for `error` in the response
- Use parameterized queries — never interpolate user input into SQL strings
- Long-running queries must have explicit timeouts
- Avoid N+1 queries — use batch operations or joins where possible

## Performance

- Use `Promise.all` for independent async operations — never `await` sequentially when parallel is possible
- Cache expensive computations (embeddings, LLM calls) where appropriate
- Paginate all list endpoints — never return unbounded arrays
