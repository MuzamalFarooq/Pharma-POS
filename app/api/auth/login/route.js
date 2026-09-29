import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/tenant';

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = validated.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            organization: true,
            branch: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (!user.memberships || user.memberships.length === 0) {
      return NextResponse.json(
        { error: 'Your account is not associated with any active pharmacy organization' },
        { status: 403 }
      );
    }

    const activeMembership = user.memberships[0];

    // Find main/default branch
    const branches = await prisma.branch.findMany({
      where: { organizationId: activeMembership.organizationId, status: 'ACTIVE' },
    });
    const activeBranch = branches.find((b) => b.id === activeMembership.branchId) || branches[0];

    const token = await createSessionToken({
      userId: user.id,
      activeOrganizationId: activeMembership.organizationId,
      activeBranchId: activeBranch?.id || null,
      role: activeMembership.role,
    });

    await setSessionCookie(token);

    await logAuditEvent({
      organizationId: activeMembership.organizationId,
      branchId: activeBranch?.id,
      userId: user.id,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: user.id,
      metadata: { role: activeMembership.role },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email },
      organization: { id: activeMembership.organization.id, name: activeMembership.organization.name },
      role: activeMembership.role,
      redirect: '/dashboard',
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
