# Testing Strategy, Observability & Continuous Delivery

A test suite is not a checkbox; it is an executable specification and safety harness that allows developers to deploy code to production multiple times a day with zero fear.

---

## 1. The Practical Testing Pyramid

```
        /   E2E Tests   \        <- Fewest (5-10%): Critical user journeys (e.g. Full Checkout)
       /                 \
      / Integration Tests \      <- Sweet Spot (30-40%): API routes, DB transactions, ORM repositories
     /                     \
    /     Unit Tests        \    <- Largest (50-60%): Pure domain logic, pricing, validation, algorithms
   ───────────────────────────
```

### 1. Unit Tests:
- Test pure functions, state machines, domain invariants, and mathematical formulas.
- Fast execution (< 5ms per test), zero network I/O, zero database setup.

### 2. Integration Tests:
- Test the integration between two or more components (e.g., API handler -> Prisma ORM -> PostgreSQL testcontainer/branch).
- Verify real SQL queries, foreign key constraints, unique indexes, and rollback behaviors.

### 3. End-to-End (E2E) Tests:
- Test full browser-to-backend flows using Playwright.
- Test the "money flows": Authentication -> Add to Cart -> Checkout -> Receipt Generation.

---

## 2. Test Doubles: Mocks, Stubs & Fakes

- **Stub**: Provides canned answers to calls made during tests (e.g., returning fixed exchange rate).
- **Mock**: Expects specific calls and fails if those exact calls aren't made (use sparingly; over-mocking leads to brittle tests that break on internal refactors).
- **Fake**: Has a working implementation, but takes shortcuts (e.g., an in-memory `InMemoryProductRepository` backed by a `Map`). **Senior engineers favor Fakes over heavy Mocks** because they preserve realistic behaviors.

---

## 3. Observability: The Three Pillars

A production system must be observable without deploying new code.

### 1. Structured Logging (JSON)
Never output unstructured strings. Log structured JSON objects with correlation IDs.

```typescript
logger.info('Prescription dispensed successfully', {
  correlationId: req.headers['x-correlation-id'],
  prescriptionId: prescription.id,
  pharmacistId: user.id,
  durationMs: 42,
  inventoryDeducted: 10
});
```

### 2. Metrics (RED Method)
Monitor services via:
- **Rate**: Number of requests per second.
- **Errors**: Number of failing requests per second.
- **Duration**: Latency percentiles ($p50$, $p95$, $p99$).

### 3. Distributed Tracing
- Propagate trace IDs (`traceparent` header) across service boundaries to trace the lifecycle of a request from front-end click to database query.
