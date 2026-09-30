# Software Architecture & System Design Guide

Senior engineers architect systems that accommodate change, minimize coupling, and maintain data consistency across distributed boundaries.

---

## 1. Architectural Layers & Separation of Concerns

Enforce strict dependency flow (outside-in). Outer layers may depend on inner layers, but inner layers must NEVER depend on outer layers.

```
┌────────────────────────────────────────────────────────┐
│  Presentation / Transport Layer                        │
│  (Next.js App Router, Express, Controllers, DTOs)      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Application / Use Case Layer                          │
│  (Orchestrators, Workflows, Command Handlers)          │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│  Domain / Business Logic Layer                         │
│  (Entities, Value Objects, Domain Policies, Invariants)│
└──────────────────────────▲─────────────────────────────┘
                           │ Dependency Inversion
┌──────────────────────────┴─────────────────────────────┐
│  Infrastructure / Adapter Layer                        │
│  (Prisma ORM, PostgreSQL, Redis, Stripe, Mailer)       │
└────────────────────────────────────────────────────────┘
```

### Architectural Principles:
1. **Domain Isolation**: Core business rules (e.g. prescription validation, pricing calculation, discount logic) must never import ORM client objects or HTTP request objects directly.
2. **Repository Pattern & Ports/Adapters**: Interact with databases via domain repository interfaces (e.g., `OrderRepository`), allowing unit tests to use in-memory adapters without booting Postgres.
3. **Data Transfer Objects (DTOs)**: Never expose internal database entity models directly over API responses; always map through strict DTO serializers to prevent overfetching or leaking sensitive columns (passwords, salts, tenant IDs).

---

## 2. SOLID Design Principles in Practice

- **Single Responsibility (SRP)**: A module or class should have one, and only one, reason to change. Separate data persistence from email notifications and business validation.
- **Open/Closed (OCP)**: Software entities should be open for extension, but closed for modification. Use strategy objects or plugin hooks rather than giant `switch` statements across multiple files.
- **Liskov Substitution (LSP)**: Subtypes must be substitutable for their base types without altering program correctness.
- **Interface Segregation (ISP)**: Clients should not be forced to depend on methods they do not use. Split fat interfaces into narrow, cohesive contracts.
- **Dependency Inversion (DIP)**: High-level modules should not depend on low-level modules; both should depend on abstractions.

---

## 3. Data Modeling & Database Architecture

1. **Normalized OLTP vs Denormalized Read Views**:
   - Normalize transaction tables (3NF) to guarantee ACID integrity and prevent write anomalies.
   - For high-throughput analytics, dashboards, or search, maintain denormalized materialized views or search indexes (e.g., Lakebase/Postgres full-text search, Elastic).
2. **Transaction Boundaries**:
   - Always group related database mutations that must succeed or fail together inside atomic transactions.
   - Keep transactions short! Never make external HTTP network calls or perform expensive image processing inside an open database transaction lock.
3. **Optimistic vs Pessimistic Locking**:
   - **Optimistic Concurrency**: Use a `version` or `updated_at` column (`UPDATE products SET stock = stock - 1, version = version + 1 WHERE id = :id AND version = :current_version`). Perfect for low-to-medium contention scenarios.
   - **Pessimistic Concurrency**: Use `SELECT ... FOR UPDATE` for high-contention, critical resources (e.g., flash sales, limited medicine batches, ticket reservations).

---

## 4. Scalability & Distributed Systems Patterns

- **Modular Monolith First**: Keep services in a single repository with clear package/domain boundaries until organizational team size or vastly different hardware scaling profiles strictly demand separate deployables.
- **Idempotency**: All mutating operations (POST, PUT, DELETE) must be safe to retry. Support `Idempotency-Key` headers stored in Redis or Postgres with unique constraints.
- **CQRS (Command Query Responsibility Segregation)**: Separate read paths (optimized for speed and projection) from write paths (optimized for invariant validation and transactional consistency).
- **Outbox Pattern**: When a database write must trigger an external message (webhook, message queue, email), write the event to an `outbox` table within the same DB transaction, then asynchronously dispatch it. This eliminates two-phase commit failures.
