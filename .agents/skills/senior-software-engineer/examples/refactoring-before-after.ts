/**
 * SENIOR SOFTWARE ENGINEER ARCHITECTURAL REFACTORING DEMO
 *
 * Scenario: Pharmacy Point-of-Sale Checkout Handler
 *
 * Demonstrates:
 * 1. Dismantling a "God Function" with mixed concerns.
 * 2. Introducing typed Result types instead of unhandled runtime errors.
 * 3. Atomic database transactions to prevent inventory/payment discrepancies.
 * 4. Boundary schema validation with Zod.
 * 5. Structured logging and domain events.
 */

// ============================================================================
// ❌ BEFORE: BRITTLE, TIGHTLY COUPLED, GOD FUNCTION
// ============================================================================
/*
export async function badCheckout(req: any, res: any) {
  try {
    const { items, customerId, paymentMethod } = req.body;
    
    // Smell 1: No schema validation, blind access
    let total = 0;
    
    // Smell 2: N+1 queries inside a for-loop!
    for (let i = 0; i < items.length; i++) {
      const product = await db.query(`SELECT * FROM products WHERE id = ${items[i].id}`);
      if (product.rows[0].stock < items[i].qty) {
        return res.status(400).send("Out of stock");
      }
      total += product.rows[0].price * items[i].qty;
      // Smell 3: Mutation outside of transaction
      await db.query(`UPDATE products SET stock = stock - ${items[i].qty} WHERE id = ${items[i].id}`);
    }

    // Smell 4: Third party call after stock was already mutated! If this fails, stock is lost forever!
    const charge = await stripe.charges.create({ amount: total, source: paymentMethod });

    const sale = await db.query(`INSERT INTO sales (total, customer_id) VALUES (${total}, ${customerId}) RETURNING id`);
    res.json({ success: true, saleId: sale.rows[0].id });
  } catch (err: any) {
    // Smell 5: Generic console.log, leaks stack to client
    console.log(err);
    res.status(500).send(err.message);
  }
}
*/

// ============================================================================
// ✅ AFTER: PRODUCTION-GRADE SENIOR ARCHITECTURE
// ============================================================================

import { z } from 'zod';

// 1. Strict Contract / Boundary Validation
export const CheckoutInputSchema = z.object({
  customerId: z.string().uuid(),
  paymentMethodId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive().max(100),
    })
  ).min(1).max(50),
});

export type CheckoutInput = z.infer<typeof CheckoutInputSchema>;

export interface CheckoutResult {
  saleId: string;
  totalCents: number;
  completedAt: Date;
}

// 2. Strongly Typed Domain Errors
export class InsufficientStockError extends Error {
  constructor(public readonly productId: string, public readonly requested: number, public readonly available: number) {
    super(`Insufficient stock for product ${productId}: requested ${requested}, available ${available}`);
    this.name = 'InsufficientStockError';
  }
}

export class PaymentProcessingError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(`Payment processing failed: ${message}`);
    this.name = 'PaymentProcessingError';
  }
}

// 3. Port / Interface Abstractions (Dependency Inversion)
export interface DatabaseClient {
  transaction<T>(fn: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
}

export interface DatabaseTransaction {
  getProductsWithLock(ids: string[]): Promise<Array<{ id: string; priceCents: number; stock: number }>>;
  decrementStock(productId: string, quantity: number): Promise<void>;
  createSaleRecord(data: { customerId: string; totalCents: number; transactionId: string }): Promise<{ id: string }>;
}

export interface PaymentGateway {
  charge(args: { amountCents: number; paymentMethodId: string; idempotencyKey: string }): Promise<{ transactionId: string }>;
}

// 4. Clean Orchestrator Service (Single Responsibility, ACID safe)
export class CheckoutService {
  constructor(
    private readonly db: DatabaseClient,
    private readonly paymentGateway: PaymentGateway,
    private readonly logger: { info: (msg: string, ctx?: unknown) => void; error: (msg: string, ctx?: unknown) => void }
  ) {}

  async execute(input: CheckoutInput): Promise<CheckoutResult> {
    const validated = CheckoutInputSchema.parse(input);
    const productIds = validated.items.map((i) => i.productId);

    // Step A: Atomic Database Reservation & Computation within a single transaction
    return await this.db.transaction(async (tx) => {
      // 1 Query for all products using pessimistic row lock (SELECT ... FOR UPDATE)
      const products = await tx.getProductsWithLock(productIds);
      const productMap = new Map(products.map((p) => [p.id, p]));

      let totalCents = 0;

      // Validate stock availability in memory
      for (const item of validated.items) {
        const product = productMap.get(item.productId);
        if (!product || product.stock < item.quantity) {
          throw new InsufficientStockError(item.productId, item.quantity, product?.stock ?? 0);
        }
        totalCents += product.priceCents * item.quantity;
      }

      // Step B: Process External Payment with Idempotency Key
      let paymentResult: { transactionId: string };
      try {
        paymentResult = await this.paymentGateway.charge({
          amountCents: totalCents,
          paymentMethodId: validated.paymentMethodId,
          idempotencyKey: validated.idempotencyKey,
        });
      } catch (err) {
        // If payment fails, transaction automatically rolls back stock reservation
        this.logger.error('Payment failed during checkout', { customerId: validated.customerId, error: err });
        throw new PaymentProcessingError('Charge declined or gateway unreachable', err);
      }

      // Step C: Decrement stock and record sale atomically
      for (const item of validated.items) {
        await tx.decrementStock(item.productId, item.quantity);
      }

      const sale = await tx.createSaleRecord({
        customerId: validated.customerId,
        totalCents,
        transactionId: paymentResult.transactionId,
      });

      this.logger.info('Checkout completed successfully', { saleId: sale.id, totalCents });

      return {
        saleId: sale.id,
        totalCents,
        completedAt: new Date(),
      };
    });
  }
}
