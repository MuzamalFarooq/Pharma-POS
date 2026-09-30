# Senior Engineer Pull Request & Code Review Checklist

Use this checklist during PR reviews and pre-commit self-reviews to guarantee enterprise-grade quality.

---

## 1. Architectural Integrity & Design
- [ ] **Single Responsibility**: Does each class, module, and function perform exactly one well-defined responsibility?
- [ ] **Layering Discipline**: Are presentation concerns (HTTP/headers) decoupled from business logic and database queries?
- [ ] **Contract Design**: Are request/response types strictly modeled with TypeScript interfaces or Zod schemas?
- [ ] **Abstraction Balance**: Is the design simple enough (KISS/YAGNI)? Does it avoid premature microservices, over-generalized factories, or needless indirection?

---

## 2. Correctness & Edge-Case Resilience
- [ ] **Boundary Conditions**: Are null, undefined, 0, negative numbers, empty arrays, and ultra-large inputs properly handled?
- [ ] **Concurrency & Race Conditions**: Are state changes protected against concurrent execution (atomic DB updates, locks, or idempotency keys)?
- [ ] **Transactional Atomicity**: Are multi-table database mutations wrapped in a transaction (`$transaction` or `BEGIN...COMMIT`)?
- [ ] **Zero Silent Errors**: Are try/catch blocks either handling errors or re-throwing with contextual details? No empty `catch (e) {}` blocks!

---

## 3. Performance & Resource Management
- [ ] **No N+1 Queries**: Are database relations loaded eagerly or batched instead of queried inside loops?
- [ ] **Index Coverage**: Are foreign keys and query `WHERE` / `ORDER BY` columns supported by appropriate indexes?
- [ ] **Resource Cleanup**: Are database connections, file handles, event listeners, and timers properly closed/unsubscribed?
- [ ] **Payload & Memory Bound**: Are lists paginated (cursor/keyset pagination)? Are unneeded columns excluded (`SELECT *` avoided)?

---

## 4. Security & Hardening
- [ ] **Server-Side Authorization**: Are user permissions and tenant IDs verified server-side on every route?
- [ ] **Injection Prevention**: Are all SQL queries parameterized?
- [ ] **Input Sanitization**: Is untrusted client input validated at the controller boundary?
- [ ] **Secrets & PII Protection**: Are API keys, passwords, and sensitive healthcare data excluded from git, logs, and client bundles?

---

## 5. Testability & Maintainability
- [ ] **Deterministic Tests**: Are tests repeatable, independent, and free of flaky timing issues (`setTimeout`)?
- [ ] **Readable Code**: Are variable and function names self-documenting? Are complex business rules accompanied by "why" comments rather than "what" comments?
- [ ] **Observability**: Are significant business events and errors logged with structured metadata and correlation IDs?
