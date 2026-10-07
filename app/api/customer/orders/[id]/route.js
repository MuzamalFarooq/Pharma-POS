import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getTenantContext } from '@/lib/tenant';
import { PERMISSIONS } from '@/lib/rbac';

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

const allowedTransitions = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

export async function PATCH(request, { params }) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SALES_CREATE);
    if (tenant.error) {
      return NextResponse.json({ error: tenant.error }, { status: tenant.status });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }
    const validated = statusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid order status update', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id } = await params;
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.customerOrder.findFirst({
        where: { id, organizationId: tenant.organizationId },
        include: { items: { select: { batchId: true, medicineId: true, quantity: true } } },
      });

      if (!order) return { error: 'Order not found', status: 404 };
      if (order.status === validated.data.status) return { order, unchanged: true };
      if (!allowedTransitions[order.status]?.includes(validated.data.status)) {
        return { error: `Cannot move an order from ${order.status} to ${validated.data.status}.`, status: 409 };
      }

      const updated = await tx.customerOrder.updateMany({
        where: {
          id: order.id,
          organizationId: tenant.organizationId,
          status: order.status,
          stockReserved: order.stockReserved,
        },
        data: {
          status: validated.data.status,
          ...(validated.data.status === 'CANCELLED' && order.stockReserved ? { stockReserved: false } : {}),
        },
      });
      if (updated.count !== 1) {
        return { error: 'Order status changed concurrently. Refresh and try again.', status: 409 };
      }

      if (validated.data.status === 'CANCELLED' && order.stockReserved) {
        const quantitiesByBatch = new Map();
        for (const item of order.items) {
          const current = quantitiesByBatch.get(item.batchId) || { medicineId: item.medicineId, quantity: 0 };
          current.quantity += item.quantity;
          quantitiesByBatch.set(item.batchId, current);
        }

        for (const [batchId, item] of quantitiesByBatch) {
          const restored = await tx.medicineBatch.updateMany({
            where: {
              id: batchId,
              organizationId: order.organizationId,
              branchId: order.branchId,
            },
            data: { quantity: { increment: item.quantity } },
          });
          if (restored.count !== 1) {
            throw new Error(`Unable to restore reserved stock for order ${order.id}, batch ${batchId}`);
          }

          await tx.inventoryTransaction.create({
            data: {
              organizationId: order.organizationId,
              branchId: order.branchId,
              medicineId: item.medicineId,
              batchId,
              type: 'ADJUSTMENT',
              quantity: item.quantity,
              referenceId: order.id,
              notes: `Stock released after cancellation of customer order ${order.id}`,
              createdByUserId: tenant.userId,
            },
          });
        }
      }

      const updatedOrder = await tx.customerOrder.findUnique({
        where: { id: order.id },
        include: {
          items: { include: { medicine: true, batch: true } },
          branch: true,
        },
      });
      return { order: updatedOrder };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, order: result.order });
  } catch (error) {
    console.error('Update customer order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
