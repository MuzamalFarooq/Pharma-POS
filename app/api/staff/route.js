import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { hashPassword } from '@/lib/auth';
import { staffInviteSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET() {
  const tenant = await getTenantContext(PERMISSIONS.USERS_MANAGE);
  if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

  const members = await prisma.organizationMember.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ members });
}

export async function POST(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.USERS_MANAGE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = staffInviteSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { name, email, role, branchId } = validated.data;
    const { organizationId } = tenant;

    // Security Check: Users cannot assign themselves or others OWNER privileges via this API
    if (role === 'OWNER' && tenant.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only the current Owner can assign OWNER privileges' }, { status: 403 });
    }

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const defaultPasswordHash = await hashPassword('Password123!');
      user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase().trim(),
          passwordHash: defaultPasswordHash,
        },
      });
    }

    // Check existing membership in this org
    const existingMember = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member of this pharmacy organization' }, { status: 409 });
    }

    const member = await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId,
        role,
        status: 'ACTIVE',
        branchId: branchId || tenant.branchId || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        branch: { select: { name: true } },
      },
    });

    await logAuditEvent({
      organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'STAFF_INVITED',
      entity: 'OrganizationMember',
      entityId: member.id,
      metadata: { invitedEmail: email, assignedRole: role },
    });

    return NextResponse.json({ success: true, member });
  } catch (error) {
    console.error('Staff POST error:', error);
    return NextResponse.json({ error: 'Failed to invite staff member' }, { status: 500 });
  }
}
