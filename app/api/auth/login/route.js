import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { loginSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/tenant';
import { getPlatformOwnerConfig, isPlatformOwnerEmail, verifyPlatformOwnerCredentials } from '@/lib/platform-owner';
import { z } from 'zod';

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = loginSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid email or password format' }, { status: 400 });
    }

    const { email, password } = validated.data;
    const identifier = email.trim();
    const normalizedEmail = identifier.toLowerCase();
    const { email: configuredOwnerEmail, emails: configuredOwnerEmails, name: configuredOwnerName, password: configuredOwnerPassword } = getPlatformOwnerConfig();

    if (configuredOwnerEmails.length > 0 && configuredOwnerEmails.includes(normalizedEmail)) {
      if (!configuredOwnerPassword) {
        return NextResponse.json({ error: 'Platform owner authentication is not configured.' }, { status: 500 });
      }

      const isOwnerMatch = verifyPlatformOwnerCredentials(identifier, password);
      if (!isOwnerMatch) {
        return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
      }

      const token = await createSessionToken({
        userId: `platform-owner:${configuredOwnerEmail || normalizedEmail}`,
        role: 'PLATFORM_OWNER',
        platformOwner: true,
        name: configuredOwnerName,
      });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: { id: `platform-owner:${configuredOwnerEmail || normalizedEmail}`, name: configuredOwnerName, email: configuredOwnerEmail || normalizedEmail },
        role: 'PLATFORM_OWNER',
        redirect: '/owner',
      });
    }

    if (configuredOwnerEmails.length === 0 && configuredOwnerPassword) {
      return NextResponse.json({ error: 'Platform owner authentication is not configured. Set PHARMA_PLATFORM_OWNER_EMAIL and PHARMA_PLATFORM_OWNER_PASSWORD in the server environment.' }, { status: 500 });
    }

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: {
            organization: true,
            branch: true,
          },
        },
      },
    });

    if (!user && !normalizedEmail.includes('@')) {
      user = await prisma.user.findFirst({
        where: {
          email: { startsWith: `${normalizedEmail}@`, mode: 'insensitive' },
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
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    const isPlatformOwner = isPlatformOwnerEmail(user.email);
    if (isPlatformOwner && (normalizedEmail !== user.email.toLowerCase() || !z.email().safeParse(normalizedEmail).success)) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    if (!user.passwordHash) {
      return NextResponse.json(
        { error: 'This account was registered with Google. Please use Continue with Google or reset your password.' },
        { status: 400 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });
    }

    if (isPlatformOwner) {
      const token = await createSessionToken({
        userId: user.id,
        role: 'PLATFORM_OWNER',
        tokenVersion: user.passwordVersion || 1,
      });
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
      const token = await createSessionToken({
        userId: user.id,
        role: 'CUSTOMER',
        tokenVersion: user.passwordVersion || 1,
      });
      await setSessionCookie(token);

      return NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
        role: 'CUSTOMER',
        redirect: '/customer',
      });
    }

    const activeMembership = activeMemberships[0];

    const branches = await prisma.branch.findMany({
      where: { organizationId: activeMembership.organizationId, status: 'ACTIVE' },
    });
    const activeBranch = branches.find((b) => b.id === activeMembership.branchId) || branches[0];

    const token = await createSessionToken({
      userId: user.id,
      activeOrganizationId: activeMembership.organizationId,
      activeBranchId: activeBranch?.id || null,
      role: activeMembership.role,
      tokenVersion: user.passwordVersion || 1,
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
