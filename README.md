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

## Pharmacy1 demo catalog

`npm run seed:pharmacy1` adds 100 general demo medicines plus 50 section-specific demo medicines for each customer storefront section (350 total), with local illustrative pack images, stock batches, and opening inventory records, to the active `MAIN` branch of the `pharmacy1-1259` organization. It is safe to rerun: existing demo SKUs, batches, and inventory records are retained.

`npm run seed:lahore` creates five independent Lahore demo pharmacy organizations and main branches, each with its own copy of the 350-medicine catalog and stocked inventory. It is safe to rerun. Use `npm run seed:lahore -- --dry-run` to check the catalog without connecting to the database. For a newly registered pharmacy, run `npm run seed:pharmacy -- --organization=<organization-slug>` to add the demo catalog and stock to its active `MAIN` branch; the slug is available from the pharmacy's organization record.
