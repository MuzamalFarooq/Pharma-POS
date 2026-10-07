ALTER TABLE "CustomerOrder"
ADD COLUMN "idempotencyKey" TEXT,
ADD COLUMN "stockReserved" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "CustomerOrder_idempotencyKey_key"
ON "CustomerOrder"("idempotencyKey");

CREATE INDEX "Customer_userId_organizationId_idx"
ON "Customer"("userId", "organizationId");
