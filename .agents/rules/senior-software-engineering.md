# Senior Software Engineering Principles & Code Quality

Whenever writing, refactoring, or reviewing code in this codebase:

1. **Architectural Discipline & Decoupling**:
   - Maintain clear separation of concerns (presentation, business logic, data persistence).
   - Never write monolithic "God functions" doing routing, validation, database access, and external calls all in one place.
   - Separate domain rules from ORM models and HTTP transports.

2. **Defensive Coding & Reliability**:
   - Always validate external input at system boundaries with schemas (e.g. Zod).
   - Wrap multi-table state mutations in atomic database transactions (`$transaction` or `BEGIN...COMMIT`).
   - Eliminate silent failures: never write empty `catch` blocks or discard error stack traces.

3. **Performance & Scalability**:
   - Avoid N+1 queries by eager-loading relations or batching requests.
   - Avoid `SELECT *`; fetch only the columns required.
   - Use cursor-based pagination for large datasets.
   - Ensure proper indexes exist for foreign keys and frequent filter/sort columns.

4. **Security & Production Hardening**:
   - Validate authorization server-side on every request (never trust client-supplied user IDs or role claims).
   - Use parameterized queries; never concatenate user input into raw SQL.
   - Guard against XSS, CSRF, and timing attacks.
