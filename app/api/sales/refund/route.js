import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { PERMISSIONS } from '@/lib/rbac';

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SALES_REFUND);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const { saleId, reason } = await req.json();

    if (!saleId) {
      return NextResponse.json({ error: 'Sale ID is required' }, { status: 400 });
    }

    const { organizationId, branchId, userId } = tenant;

    const sale = await prisma.sale.findFirst({
      where: { id: saleId, organizationId },
      include: { items: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale record not found' }, { status: 404 });
    }

    if (sale.status === 'REFUNDED') {
      return NextResponse.json({ error: 'Sale has already been refunded' }, { status: 400 });
    }

    // Transaction to update sale status, restore batch quantities, create inventory transactions
    const refundedSale = await prisma.$transaction(async (tx) => {
      // 1. Mark Sale as REFUNDED
      const updatedSale = await tx.sale.update({
        where: { id: saleId },
        data: { status: 'REFUNDED', notes: `Refunded: ${reason || 'Customer Return'}` },
      });

      // 2. Mark Invoice as CANCELLED
      await tx.invoice.updateMany({
        where: { saleId, organizationId },
        data: { status: 'CANCELLED' },
      });

      // 3. Restore batch stock & log inventory transaction
      for (const item of sale.items) {
        await tx.medicineBatch.update({
          where: { id: item.batchId },
          data: { quantity: { increment: item.quantity } },
        });

        await tx.inventoryTransaction.create({
          data: {
            organizationId,
            branchId: sale.branchId,
            medicineId: item.medicineId,
            batchId: item.batchId,
            type: 'REFUND',
            quantity: item.quantity,
            referenceId: sale.id,
            notes: `Refund for Sale ${sale.saleNumber}: ${reason || 'Return'}`,
            createdByUserId: userId,
          },
        });
      }

      return updatedSale;
    });

    await logAuditEvent({
      organizationId,
      branchId,
      userId,
      action: 'SALE_REFUNDED',
      entity: 'Sale',
      entityId: sale.id,
      metadata: { saleNumber: sale.saleNumber, amount: sale.total, reason },
    });

    return NextResponse.json({ success: true, sale: refundedSale });
  } catch (error) {
    console.error('Refund API error:', error);
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 });
  }
}
