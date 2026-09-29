import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { purchaseSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.PURCHASES_READ);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const purchases = await prisma.purchase.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      supplier: true,
      branch: true,
      createdByUser: { select: { name: true } },
      items: { include: { medicine: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ purchases });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.PURCHASES_CREATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = purchaseSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { supplierId, branchId, invoiceRef, items } = validated.data;
    const { organizationId, userId } = tenant;

    const targetBranchId = branchId || tenant.branchId || (await prisma.branch.findFirst({ where: { organizationId } })).id;

    const purchaseResult = await prisma.$transaction(async (tx) => {
      let totalAmount = 0;
      const purchaseItemsToCreate = [];

      for (const item of items) {
        const itemTotal = item.purchasePrice * item.quantity;
        totalAmount += itemTotal;

        purchaseItemsToCreate.push({
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          quantity: item.quantity,
          purchasePrice: item.purchasePrice,
          sellingPrice: item.sellingPrice,
          expiryDate: new Date(item.expiryDate),
        });

        // 1. Create or update batch
        const existingBatch = await tx.medicineBatch.findFirst({
          where: {
            organizationId,
            branchId: targetBranchId,
            medicineId: item.medicineId,
            batchNumber: item.batchNumber,
          },
        });

        let batchId;
        if (existingBatch) {
          const updated = await tx.medicineBatch.update({
            where: { id: existingBatch.id },
            data: {
              quantity: { increment: item.quantity },
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              supplierId,
            },
          });
          batchId = updated.id;
        } else {
          const created = await tx.medicineBatch.create({
            data: {
              organizationId,
              branchId: targetBranchId,
              medicineId: item.medicineId,
              supplierId,
              batchNumber: item.batchNumber,
              purchasePrice: item.purchasePrice,
              sellingPrice: item.sellingPrice,
              quantity: item.quantity,
              expiryDate: new Date(item.expiryDate),
            },
          });
          batchId = created.id;
        }

        // 2. Log transaction
        await tx.inventoryTransaction.create({
          data: {
            organizationId,
            branchId: targetBranchId,
            medicineId: item.medicineId,
            batchId,
            type: 'PURCHASE',
            quantity: item.quantity,
            notes: `Supplier Purchase ${invoiceRef || ''}`,
            createdByUserId: userId,
          },
        });
      }

      const purchaseNum = `PUR-${Date.now().toString().slice(-6)}`;

      const purchase = await tx.purchase.create({
        data: {
          organizationId,
          branchId: targetBranchId,
          supplierId,
          purchaseNumber: purchaseNum,
          invoiceRef: invoiceRef || null,
          totalAmount,
          netAmount: totalAmount,
          createdByUserId: userId,
          status: 'COMPLETED',
          items: {
            create: purchaseItemsToCreate,
          },
        },
        include: {
          supplier: true,
          items: { include: { medicine: true } },
        },
      });

      return purchase;
    });

    await logAuditEvent({
      organizationId,
      branchId: targetBranchId,
      userId,
      action: 'PURCHASE_CREATED',
      entity: 'Purchase',
      entityId: purchaseResult.id,
      metadata: { purchaseNumber: purchaseResult.purchaseNumber, totalAmount: purchaseResult.totalAmount },
    });

    return NextResponse.json({ success: true, purchase: purchaseResult });
  } catch (error) {
    console.error('Purchase POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process purchase' }, { status: 500 });
  }
}
