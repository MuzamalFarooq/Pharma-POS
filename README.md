# Pharma-POS
Multi-tenant Pharmacy Management and POS SaaS platform for inventory, billing, sales, and store management.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Customer storefront and orders

The public medicine store is available at `/shop`. Customers can browse a selected pharmacy branch, search by medicine or generic name, filter by category, and maintain a branch-specific cart. Placing an order requires a customer account; inventory and prices are checked and reserved server-side. Customers can see only orders linked to their account at `/customer`.

Pharmacy staff with the existing sales-creation permission manage online orders from `/orders`. Cancelling an order releases its reserved stock.

## Database migration

The customer-order safety migration adds optional order idempotency keys, a stock-reservation flag, and an index for customer order lookups. It is additive and preserves existing orders. This repository did not previously contain checked-in Prisma migrations, so review and baseline the production database's migration history before applying it with `npx prisma migrate deploy`.
