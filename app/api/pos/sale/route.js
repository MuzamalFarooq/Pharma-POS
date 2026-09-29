import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { saleSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SALES_CREATE);
    if (tenant.error) {
      return NextResponse.json({ error: tenant.error }, { status: tenant.status });
    }

    const { organizationId, branchId, userId, organization } = tenant;
    const body = await req.json();
    const validated = saleSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { customerId, paymentMethod, discount, tax, items } = validated.data;

    // Database transaction for atomic POS sale completion
    const saleResult = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const saleItemsToCreate = [];
      const stockUpdates = [];

      // 1. Validate stock & compute totals
      for (const item of items) {
        const batch = await tx.medicineBatch.findFirst({
          where: {
            id: item.batchId,
            medicineId: item.medicineId,
            organizationId,
          },
          include: { medicine: true },
        });

        if (!batch) {
          throw new Error(`Medicine batch not found or does not belong to organization`);
        }

        // Expiry check
        if (new Date(batch.expiryDate) <= new Date()) {
          throw new Error(`Cannot sell expired batch ${batch.batchNumber} of ${batch.medicine.name}`);
        }

        if (batch.quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${batch.medicine.name} (Batch: ${batch.batchNumber}). Requested ${item.quantity}, available ${batch.quantity}`);
        }

        const itemTotal = (item.unitPrice * item.quantity) - (item.discount || 0);
        subtotal += itemTotal;

        saleItemsToCreate.push({
          medicineId: item.medicineId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          total: itemTotal,
        });

        stockUpdates.push({
          batchId: item.batchId,
          medicineId: item.medicineId,
          deductQuantity: item.quantity,
        });
      }

      const total = subtotal - (discount || 0) + (tax || 0);

      // 2. Increment Invoice Sequence
      const updatedOrg = await tx.organization.update({
        where: { id: organizationId },
        data: { invoiceNextNumber: { increment: 1 } },
      });

      const invNumber = `${updatedOrg.invoicePrefix}-${String(updatedOrg.invoiceNextNumber).padStart(6, '0')}`;
      const saleNum = `SALE-${String(updatedOrg.invoiceNextNumber).padStart(6, '0')}`;

      // 3. Create Sale
      const sale = await tx.sale.create({
        data: {
          organizationId,
          branchId: branchId || (await tx.branch.findFirst({ where: { organizationId } })).id,
          saleNumber: saleNum,
          customerId: customerId || null,
          cashierId: userId,
          subtotal,
          discount: discount || 0,
          tax: tax || 0,
          total,
          paymentMethod,
          status: 'COMPLETED',
          items: {
            create: saleItemsToCreate,
          },
        },
        include: {
          items: {
            include: { medicine: true, batch: true },
          },
          customer: true,
          cashier: { select: { name: true } },
          branch: { select: { name: true, phone: true, address: true } },
        },
      });

      // 4. Create Invoice
      const invoice = await tx.invoice.create({
        data: {
          organizationId,
          branchId: sale.branchId,
          invoiceNumber: invNumber,
          saleId: sale.id,
          customerId: customerId || null,
          amount: total,
          status: 'PAID',
        },
      });

      // 5. Update Inventory Batches & Log Transactions
      for (const update of stockUpdates) {
        await tx.medicineBatch.update({
          where: { id: update.batchId },
          data: { quantity: { decrement: update.deductQuantity } },
        });

        await tx.inventoryTransaction.create({
          data: {
            organizationId,
            branchId: sale.branchId,
            medicineId: update.medicineId,
            batchId: update.batchId,
            type: 'SALE',
            quantity: -update.deductQuantity,
            referenceId: sale.id,
            notes: `POS Sale ${sale.saleNumber}`,
            createdByUserId: userId,
          },
        });
      }

      // Update customer spent
      if (customerId) {
        await tx.customer.update({
          where: { id: customerId },
          data: { totalSpent: { increment: total } },
        });
      }

      return { sale, invoice };
    });

    await logAuditEvent({
      organizationId,
      branchId,
      userId,
      action: 'POS_SALE_CREATED',
      entity: 'Sale',
      entityId: saleResult.sale.id,
      metadata: { total: saleResult.sale.total, invoiceNumber: saleResult.invoice.invoiceNumber },
    });

    return NextResponse.json({
      success: true,
      sale: saleResult.sale,
      invoice: saleResult.invoice,
    });
  } catch (error) {
    console.error('POS Sale API Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to complete POS sale' }, { status: 500 });
  }
}
