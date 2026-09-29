import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { batchSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.INVENTORY_READ);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const batches = await prisma.medicineBatch.findMany({
    where: {
      organizationId: tenant.organizationId,
      branchId: tenant.branchId || undefined,
    },
    include: {
      medicine: true,
      supplier: true,
      branch: true,
    },
    orderBy: { expiryDate: 'asc' },
  });

  return NextResponse.json({ batches });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.INVENTORY_CREATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = batchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const {
      medicineId,
      supplierId,
      batchNumber,
      purchasePrice,
      sellingPrice,
      quantity,
      minStock,
      manufacturingDate,
      expiryDate,
    } = validated.data;

    const batch = await prisma.$transaction(async (tx) => {
      const b = await tx.medicineBatch.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: tenant.branchId || (await tx.branch.findFirst({ where: { organizationId: tenant.organizationId } })).id,
          medicineId,
          supplierId: supplierId || null,
          batchNumber,
          purchasePrice,
          sellingPrice,
          quantity,
          minStock,
          manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
          expiryDate: new Date(expiryDate),
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: b.branchId,
          medicineId,
          batchId: b.id,
          type: 'PURCHASE',
          quantity,
          referenceId: b.id,
          notes: `Batch ${batchNumber} initial stock entry`,
          createdByUserId: tenant.userId,
        },
      });

      return b;
    });

    await logAuditEvent({
      organizationId: tenant.organizationId,
      branchId: batch.branchId,
      userId: tenant.userId,
      action: 'BATCH_CREATED',
      entity: 'MedicineBatch',
      entityId: batch.id,
      metadata: { batchNumber, quantity, expiryDate },
    });

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 });
  }
}

// Stock Adjustment endpoint
export async function PATCH(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.INVENTORY_UPDATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const { batchId, adjustmentQuantity, reason } = body;

    if (!batchId || typeof adjustmentQuantity !== 'number') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.medicineBatch.update({
        where: { id: batchId, organizationId: tenant.organizationId },
        data: { quantity: { increment: adjustmentQuantity } },
      });

      await tx.inventoryTransaction.create({
        data: {
          organizationId: tenant.organizationId,
          branchId: b.branchId,
          medicineId: b.medicineId,
          batchId: b.id,
          type: 'ADJUSTMENT',
          quantity: adjustmentQuantity,
          notes: reason || 'Manual stock adjustment',
          createdByUserId: tenant.userId,
        },
      });

      return b;
    });

    await logAuditEvent({
      organizationId: tenant.organizationId,
      branchId: updated.branchId,
      userId: tenant.userId,
      action: 'STOCK_ADJUSTED',
      entity: 'MedicineBatch',
      entityId: updated.id,
      metadata: { adjustmentQuantity, reason },
    });

    return NextResponse.json({ success: true, batch: updated });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
