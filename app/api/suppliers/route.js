import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { supplierSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.SUPPLIERS_READ);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId: tenant.organizationId },
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ suppliers });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SUPPLIERS_CREATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = supplierSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        organizationId: tenant.organizationId,
        ...validated.data,
      },
    });

    await logAuditEvent({
      organizationId: tenant.organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'SUPPLIER_CREATED',
      entity: 'Supplier',
      entityId: supplier.id,
      metadata: { name: supplier.name },
    });

    return NextResponse.json({ success: true, supplier });
  } catch (error) {
    console.error('Supplier POST error:', error);
    return NextResponse.json({ error: 'Failed to create supplier' }, { status: 500 });
  }
}
