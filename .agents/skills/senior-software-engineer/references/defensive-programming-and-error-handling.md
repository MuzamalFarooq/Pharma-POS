# Defensive Programming, Resilience & Error Handling

A junior developer codes for the "happy path." A senior engineer designs for failure modes, partial outages, malicious inputs, network partitions, and race conditions.

---

## 1. The Result / Either Pattern vs Unhandled Exceptions

Unhandled exceptions break control flow and frequently cause uncaught promise rejections or server crashes. Model domain failures explicitly using Result objects.

```typescript
// Define Result type
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function fail<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// Domain usage example
export async function dispensePrescription(
  prescriptionId: string,
  quantity: number
): Promise<Result<{ dispensedAt: Date; remainingStock: number }, PrescriptionDomainError>> {
  const prescription = await repo.findById(prescriptionId);
  if (!prescription) {
    return fail(new PrescriptionNotFoundError(prescriptionId));
  }
  
  if (prescription.status !== 'APPROVED') {
    return fail(new InvalidPrescriptionStatusError(prescription.status));
  }

  const stockResult = await inventoryService.deductStock(prescription.medicationId, quantity);
  if (!stockResult.success) {
    return fail(new InsufficientInventoryError(stockResult.error.message));
  }

  return ok({ dispensedAt: new Date(), remainingStock: stockResult.data.remainingStock });
}
```

---

## 2. Structured & Typed Error Hierarchy

Never throw generic strings or plain `new Error("failed")`. Create a distinct, domain-aware error hierarchy with status codes and contextual details.

```typescript
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  readonly isOperational: boolean = true; // Distinguishes bugs from expected runtime errors

  constructor(message: string, public readonly metadata: Record<string, unknown> = {}) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly errorCode = 'RESOURCE_NOT_FOUND';
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly errorCode = 'CONFLICTING_STATE';
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_FAILED';
}
```

---

## 3. Resilience Patterns

### A. Exponential Backoff with Jitter
When retrying transient operations (network requests, rate-limited APIs, deadlocked DB queries), always add randomized jitter to prevent the "thundering herd" problem:

$$\text{delay} = \min(\text{maxDelay}, \text{baseDelay} \times 2^{\text{attempt}}) + \text{randomJitter}$$

```typescript
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: { retries: number; baseDelayMs: number; maxDelayMs: number }
): Promise<T> {
  const { retries, baseDelayMs, maxDelayMs } = options;
  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt >= retries) throw error;
      
      const exponential = Math.min(maxDelayMs, baseDelayMs * Math.pow(2, attempt));
      const jitter = Math.random() * (exponential * 0.2); // 20% randomized jitter
      const sleepTime = exponential + jitter;

      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }
}
```

### B. Circuit Breaker
If an external service is returning consecutive errors, trip the circuit to reject further requests immediately, allowing the downstream system time to recover.

### C. Idempotent State Mutations
- Use idempotency keys passed in headers (`X-Idempotency-Key: <UUID>`).
- Check if the key exists before running the mutation.
- Return the cached response if already completed; reject with `409 Conflict` if currently in progress.

---

## 4. Input Sanitization & Boundary Validation

Never trust any parameter from headers, query params, cookies, or request bodies.
- Validate synchronously at the controller boundary using strict schemas (e.g., Zod).
- Strip unknown properties.
- Reject payloads that exceed reasonable length or depth limits.
