DO $$
BEGIN
  CREATE TYPE "CustomerOrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Customer"
ADD COLUMN IF NOT EXISTS "userId" TEXT,
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "CustomerOrder" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "branchId" TEXT NOT NULL,
  "customerId" TEXT,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerEmail" TEXT,
  "deliveryAddress" TEXT,
  "notes" TEXT,
  "subtotal" DOUBLE PRECISION NOT NULL,
  "deliveryFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL,
  "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY',
  "status" "CustomerOrderStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT,
  "stockReserved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CustomerOrder_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "CustomerOrder"
ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
ADD COLUMN IF NOT EXISTS "stockReserved" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "CustomerOrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "medicineId" TEXT NOT NULL,
  "batchId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "total" DOUBLE PRECISION NOT NULL,
  CONSTRAINT "CustomerOrderItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CustomerOrder_idempotencyKey_key"
ON "CustomerOrder"("idempotencyKey");

CREATE INDEX IF NOT EXISTS "CustomerOrder_organizationId_branchId_createdAt_idx"
ON "CustomerOrder"("organizationId", "branchId", "createdAt");

CREATE INDEX IF NOT EXISTS "CustomerOrder_organizationId_status_idx"
ON "CustomerOrder"("organizationId", "status");

CREATE INDEX IF NOT EXISTS "CustomerOrderItem_orderId_idx"
ON "CustomerOrderItem"("orderId");

CREATE INDEX IF NOT EXISTS "Customer_organizationId_email_idx"
ON "Customer"("organizationId", "email");

CREATE INDEX IF NOT EXISTS "Customer_organizationId_phone_idx"
ON "Customer"("organizationId", "phone");

CREATE INDEX IF NOT EXISTS "Customer_userId_organizationId_idx"
ON "Customer"("userId", "organizationId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrder"'::regclass AND conname = 'CustomerOrder_organizationId_fkey') THEN
    ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrder"'::regclass AND conname = 'CustomerOrder_branchId_fkey') THEN
    ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrder"'::regclass AND conname = 'CustomerOrder_customerId_fkey') THEN
    ALTER TABLE "CustomerOrder" ADD CONSTRAINT "CustomerOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrderItem"'::regclass AND conname = 'CustomerOrderItem_orderId_fkey') THEN
    ALTER TABLE "CustomerOrderItem" ADD CONSTRAINT "CustomerOrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "CustomerOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrderItem"'::regclass AND conname = 'CustomerOrderItem_medicineId_fkey') THEN
    ALTER TABLE "CustomerOrderItem" ADD CONSTRAINT "CustomerOrderItem_medicineId_fkey" FOREIGN KEY ("medicineId") REFERENCES "Medicine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = '"CustomerOrderItem"'::regclass AND conname = 'CustomerOrderItem_batchId_fkey') THEN
    ALTER TABLE "CustomerOrderItem" ADD CONSTRAINT "CustomerOrderItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "MedicineBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
