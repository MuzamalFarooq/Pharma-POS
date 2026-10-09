import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/tenant';
import { isPlatformOwnerEmail } from '@/lib/platform-owner';

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = validated.data;
    const identifier = email.toLowerCase().trim();

    let user = await prisma.user.findUnique({
      where: { email: identifier },
      include: {
        memberships: {
          include: {
            organization: true,
            branch: true,
          },
        },
      },
    });

    if (!user && !identifier.includes('@')) {
      user = await prisma.user.findFirst({
        where: {
          email: {           startsWith: `${identifier}@`, mode: 'insensitive' },
        },
        include: {
          memberships: {
            include: {
              organization: true,
              branch: true,
            },
          },
        },
      });
    }

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    if (isPlatformOwnerEmail(user.email)) {
      const token = await createSessionToken({ userId: user.id, role: 'PLATFORM_OWNER' });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        role: 'PLATFORM_OWNER',
        redirect: '/owner',
      });
    }

    const activeMemberships = (user.memberships || []).filter(
      (membership) => membership.status === 'ACTIVE' && membership.organization.status === 'ACTIVE'
    );

    if (activeMemberships.length === 0 && user.memberships?.length > 0) {
      return NextResponse.json(
        { error: 'This pharmacy is awaiting approval or is not currently active.' },
        { status: 403 }
      );
    }

    if (activeMemberships.length === 0) {
      const token = await createSessionToken({ userId: user.id, role: 'CUSTOMER' });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        role: 'CUSTOMER',
        redirect: '/customer',
      });
    }

    const activeMembership = activeMemberships[0];

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
