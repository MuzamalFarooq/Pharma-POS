import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getTenantContext } from '@/lib/tenant';
import { PERMISSIONS } from '@/lib/rbac';

const statusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED']),
});

export async function PATCH(request, { params }) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SALES_CREATE);
    if (tenant.error) {
      return NextResponse.json({ error: tenant.error }, { status: tenant.status });
    }

    const body = await request.json();
    const validated = statusSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid order status update', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { id } = await params;
    const order = await prisma.customerOrder.findUnique({
      where: { id },
      include: { branch: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.organizationId !== tenant.organizationId) {
      return NextResponse.json({ error: 'Order does not belong to this pharmacy' }, { status: 403 });
    }

    const updatedOrder = await prisma.customerOrder.update({
      where: { id },
      data: { status: validated.data.status },
      include: {
        items: { include: { medicine: true, batch: true } },
        branch: true,
        customer: true,
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update customer order status error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update order status' }, { status: 500 });
  }
}
