# Performance Optimization, Database Tuning & Scalability

True engineering efficiency comes from algorithmic correctness, minimal I/O roundtrips, and cache hierarchies, not premature micro-optimizations.

---

## 1. Eliminating the N+1 Query Problem

The single most common performance killer in modern ORMs (Prisma, TypeORM, Drizzle, Hibernate) is querying relations inside loops.

### The Anti-Pattern (N+1 Queries):
```typescript
// BAD: 1 query to fetch sales + 50 queries to fetch each customer!
const sales = await prisma.sale.findMany({ take: 50 });
for (const sale of sales) {
  sale.customer = await prisma.customer.findUnique({ where: { id: sale.customerId } });
}
```

### The Senior Solution (Eager Join or DataLoader Batching):
```typescript
// GOOD: 1 query with eager relational join / foreign key inclusion
const sales = await prisma.sale.findMany({
  take: 50,
  include: {
    customer: {
      select: { id: true, name: true, phone: true } // Select only needed columns!
    }
  }
});
```

---

## 2. PostgreSQL Indexing Strategy

An unindexed table query forces a sequential scan ($O(N)$), locking CPU and thrashing memory caches.

### Indexing Rules of Thumb:
1. **Foreign Keys**: Always index foreign key columns (`customerId`, `pharmacyId`, `batchId`).
2. **Filter & Sort Compound Indexes**:
   - Order of columns in a composite index matters: **Equality first, Range second**.
   - If querying `WHERE store_id = 5 AND status = 'COMPLETED' ORDER BY created_at DESC`:
     - Create composite index on `(store_id, status, created_at DESC)`.
3. **Partial Indexes**:
   - Index only the active subset to save disk and write overhead:
     - `CREATE INDEX idx_active_prescriptions ON prescriptions (created_at) WHERE status = 'PENDING';`
4. **Avoid `SELECT *`**:
   - Only select columns you actually need. `SELECT *` pulls unnecessary large text, JSON blobs, or blobs into memory, prevents index-only scans, and inflates egress costs.

---

## 3. Pagination: Cursor-Based vs Offset-Based

### Why Offset Pagination Fails at Scale:
- `SELECT * FROM sales ORDER BY id LIMIT 50 OFFSET 100000;`
- The database engine still scans and sorts 100,050 rows before discarding the first 100,000! As offset grows, response times degrade linearly.

### Cursor-Based (Keyset) Pagination:
- Leverage the B-Tree index directly:
- `SELECT * FROM sales WHERE id > :last_seen_id ORDER BY id ASC LIMIT 50;`
- Execution time is constant ($O(1)$) regardless of page depth.

---

## 4. Concurrency & Async I/O

1. **Avoid Blocking the Event Loop (Node.js)**:
   - Never run CPU-intensive tasks (cryptographic key derivation, heavy image resizing, parsing 100MB JSON) on the main event thread. Offload to Web Workers or background worker processes.
2. **Bounded Concurrency with `p-limit`**:
   - Never fire unbounded `Promise.all(thousandsOfRequests)`. It will exhaust database connection pools or socket file descriptors.
   - Use concurrency pools (limit to 5–10 concurrent workers).
3. **Database Connection Pooling**:
   - Set pool size according to serverless / container compute count:
     $$\text{Pool Size} \approx (\text{CPU Cores} \times 2) + \text{Spindle/SSD Count}$$
   - On serverless architectures, use a connection pooler (such as Neon Connection Pooler / PgBouncer) to prevent exhausting database max connection limits.

---

## 5. Multi-Tier Caching

```
User Request ──► Browser / Edge Cache (CDN / Cache-Control HTTP headers)
                      │ (Miss)
                      ▼
                 Application Memory Cache (LRU Cache in-process, sub-millisecond)
                      │ (Miss)
                      ▼
                 Distributed Cache (Redis / Valkey, < 5ms)
                      │ (Miss)
                      ▼
                 PostgreSQL (Indexed, Pooled, < 50ms)
```

### Cache Invalidation Rules:
- **Cache-Aside (Lazy Loading)**: Read from cache; if miss, read from DB and write to cache with TTL.
- **Write-Through**: Write to DB and cache atomically.
- **Always set TTLs (Time-To-Live)** to prevent stale or zombie data.
