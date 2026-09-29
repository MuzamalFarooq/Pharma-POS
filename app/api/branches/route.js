import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { branchSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.BRANCHES_MANAGE);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const branches = await prisma.branch.findMany({
    where: { organizationId: tenant.organizationId },
    include: { _count: { select: { members: true, sales: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ branches });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.BRANCHES_MANAGE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = branchSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, code, phone, address, city } = validated.data;
    const { organizationId } = tenant;

    const existingCode = await prisma.branch.findFirst({
      where: { organizationId, code: code.toUpperCase().trim() },
    });

    if (existingCode) {
      return NextResponse.json({ error: 'Branch code already in use for this organization' }, { status: 409 });
    }

    const branch = await prisma.branch.create({
      data: {
        organizationId,
        name,
        code: code.toUpperCase().trim(),
        phone: phone || null,
        address: address || null,
        city: city || null,
      },
    });

    await logAuditEvent({
      organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'BRANCH_CREATED',
      entity: 'Branch',
      entityId: branch.id,
      metadata: { name, code: branch.code },
    });

    return NextResponse.json({ success: true, branch });
  } catch (error) {
    console.error('Branch POST error:', error);
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
  }
}
