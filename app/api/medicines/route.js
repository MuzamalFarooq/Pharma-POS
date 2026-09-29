import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { medicineSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.INVENTORY_READ);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const medicines = await prisma.medicine.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      category: true,
      batches: {
        where: { organizationId: tenant.organizationId },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ medicines });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.INVENTORY_CREATE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = medicineSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const medicine = await prisma.medicine.create({
      data: {
        organizationId: tenant.organizationId,
        ...validated.data,
      },
    });

    await logAuditEvent({
      organizationId: tenant.organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'MEDICINE_CREATED',
      entity: 'Medicine',
      entityId: medicine.id,
      metadata: { name: medicine.name, barcode: medicine.barcode },
    });

    return NextResponse.json({ success: true, medicine });
  } catch (error) {
    console.error('Medicine POST error:', error);
    return NextResponse.json({ error: 'Failed to create medicine' }, { status: 500 });
  }
}
