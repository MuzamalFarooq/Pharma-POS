# Clean Code, Refactoring & Code Smells

Clean code is not about theoretical aesthetics; it is about reducing cognitive load, preventing regression bugs, and enabling teams to ship features with high velocity and confidence.

---

## 1. Recognizing & Eliminating Code Smells

| Code Smell | Warning Signs | Senior Refactoring Strategy |
| :--- | :--- | :--- |
| **God Object / Giant File** | Files > 500 lines doing routing, DB access, validation, and email dispatch. | Extract domain services, separate controllers from use-cases, and isolate persistence into repositories. |
| **Primitive Obsession** | Using plain strings and numbers for domains (`email: string`, `money: number`, `status: string`). | Use Value Objects (`Email`, `Money`, `Currency`, `PrescriptionId`) or branded types to encapsulate validation. |
| **Deep Nested Conditionals** | 4+ levels of `if (a) { if (b) { if (c) ... } }`. | Invert checks and use **Guard Clauses** with early returns. |
| **Long Parameter Lists** | Functions taking 5+ positional arguments: `fn(a, b, c, d, e)`. | Consolidate into a strongly-typed Configuration Object or Command DTO. |
| **Shotgun Surgery** | A single business change requires editing 10 disparate files. | Inverted cohesion: group related business rules together into a single module/domain service. |
| **Feature Envy** | A method in class A constantly queries getters of class B to compute a value. | Move the method onto class B where the data naturally lives. |

---

## 2. Refactoring Patterns in Action

### A. Guard Clauses (Flattening Arrow Code)

```typescript
// BEFORE: High cognitive load, deep pyramid of doom
async function processPrescriptionSale(order: Order, user: User) {
  if (user) {
    if (user.hasPermission('DISPENSE_MEDS')) {
      if (order.items && order.items.length > 0) {
        if (!order.isExpired()) {
          // core logic here 4 indentation levels deep...
        } else {
          throw new Error('Order expired');
        }
      } else {
        throw new Error('No items');
      }
    } else {
      throw new Error('Unauthorized');
    }
  } else {
    throw new Error('User required');
  }
}

// AFTER: Guard Clauses, zero nesting, crystal clear intent
async function processPrescriptionSale(order: Order, user: User) {
  if (!user) throw new UnauthorizedError('User session required');
  if (!user.hasPermission('DISPENSE_MEDS')) throw new ForbiddenError('Insufficient dispensing permissions');
  if (!order.items?.length) throw new ValidationError('Order must contain at least one item');
  if (order.isExpired()) throw new ConflictError('Order has expired');

  // Core execution path is flat, readable, and uninterrupted
  return executeOrderDispensing(order, user);
}
```

### B. Replace Conditional Switch with Strategy / Polymorphism

```typescript
// BEFORE: Fragile switch that grows endlessly
function calculateDiscount(tier: string, amount: number): number {
  switch (tier) {
    case 'VIP': return amount * 0.2;
    case 'SENIOR': return amount * 0.15;
    case 'STAFF': return amount * 0.3;
    default: return 0;
  }
}

// AFTER: Open-Closed Strategy Pattern
interface DiscountStrategy {
  calculate(amount: number): number;
}

const discountStrategies: Record<string, DiscountStrategy> = {
  VIP: { calculate: (amt) => amt * 0.2 },
  SENIOR: { calculate: (amt) => amt * 0.15 },
  STAFF: { calculate: (amt) => amt * 0.3 },
  STANDARD: { calculate: () => 0 }
};

export function getDiscount(tier: string, amount: number): number {
  const strategy = discountStrategies[tier] ?? discountStrategies.STANDARD;
  return strategy.calculate(amount);
}
```

---

## 3. Safe Refactoring Workflow (The Strangler Fig Pattern)

When updating legacy or brittle code:
1. **Pin Behavior with Integration Tests**: Write end-to-end or component tests covering the existing behavior (including edge cases) before modifying a single line of code.
2. **Introduce New Abstraction in Parallel**: Build the clean new implementation side-by-side with the old code.
3. **Route Traffic Incrementally**: Use a feature flag or adapter to route 10% -> 50% -> 100% of traffic to the new implementation.
4. **Decommission Old Code**: Safely delete the old implementation once telemetry confirms zero regressions.
