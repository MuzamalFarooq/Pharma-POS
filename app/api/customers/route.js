import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { customerSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.CUSTOMERS_READ);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const customers = await prisma.customer.findMany({
    where: { organizationId: tenant.organizationId },
    include: { _count: { select: { sales: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ customers });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.CUSTOMERS_CREATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = customerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        organizationId: tenant.organizationId,
        ...validated.data,
      },
    });

    await logAuditEvent({
      organizationId: tenant.organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'CUSTOMER_CREATED',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { name: customer.name, phone: customer.phone },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error) {
    console.error('Customer POST error:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}
