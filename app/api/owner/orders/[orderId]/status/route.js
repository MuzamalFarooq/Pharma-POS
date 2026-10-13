import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
  reason: z.string().trim().max(1000).optional().default(''),
});

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { orderId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = statusSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid order status transition.' }, { status: 400 });
  }

  const { status, reason } = validated.data;

  try {
    const order = await prisma.customerOrder.findUnique({
      where: { id: orderId },
      include: {
        organization: { select: { id: true, name: true } },
        items: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status === status) {
      return NextResponse.json({ success: true, message: `Order is already ${status}.` });
    }

    // If cancelling, and stock was reserved, optionally restore stock
    await prisma.$transaction(async (tx) => {
      if (status === 'CANCELLED' && order.stockReserved && order.status !== 'CANCELLED') {
        for (const item of order.items) {
          await tx.medicineBatch.update({
            where: { id: item.batchId },
            data: { quantity: { increment: item.quantity } },
          });

          await tx.inventoryTransaction.create({
            data: {
              organizationId: order.organizationId,
              branchId: order.branchId,
              medicineId: item.medicineId,
              batchId: item.batchId,
              type: 'ADJUSTMENT',
              quantity: item.quantity,
              referenceId: order.id,
              notes: `Order cancellation by Platform Owner. Reason: ${reason || 'Administrative intervention'}`,
            },
          });
        }
      }

      await tx.customerOrder.update({
        where: { id: orderId },
        data: {
          status,
          stockReserved: status === 'CANCELLED' ? false : order.stockReserved,
        },
      });
    });

    await logPlatformAudit({
      action: 'ORDER_STATUS_UPDATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'ORDER',
      entityId: order.id,
      organizationId: order.organizationId,
      details: {
        from: order.status,
        to: status,
        reason: reason || null,
        pharmacyName: order.organization.name,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order status changed to ${status}.`,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return NextResponse.json({ error: 'Failed to update order status.' }, { status: 500 });
  }
}
