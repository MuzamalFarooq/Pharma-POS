import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies as getNextCookies } from 'next/headers';
import prisma from './db';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pharmacy-pos-saas-secret-key-production-change-me-32chars!'
);

const COOKIE_NAME = 'pharma_pos_session';

export async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function createSessionToken(payload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function getSession() {
  try {
    const cookieStore = await getNextCookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySessionToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, name: true, email: true, avatar: true },
    });

    if (!user) return null;

    // Get members for this user
    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id, status: 'ACTIVE' },
      include: {
        organization: {
          select: { id: true, name: true, slug: true, logoUrl: true, currency: true },
        },
        branch: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!memberships || memberships.length === 0) {
      return { user, activeOrganization: null, activeBranch: null, role: null, memberships: [] };
    }

    // Determine active membership
    const activeOrgId = payload.activeOrganizationId || memberships[0].organizationId;
    let activeMembership = memberships.find((m) => m.organizationId === activeOrgId) || memberships[0];

    // Get branches for active org
    const branches = await prisma.branch.findMany({
      where: { organizationId: activeMembership.organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, code: true, isMain: true },
    });

    const activeBranchId = payload.activeBranchId || activeMembership.branchId || branches[0]?.id;
    const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0] || null;

    return {
      user,
      activeOrganization: activeMembership.organization,
      activeBranch,
      role: activeMembership.role,
      memberships,
      branches,
    };
  } catch (error) {
    console.error('Session retrieval error:', error);
    return null;
  }
}

export async function setSessionCookie(token) {
  const cookieStore = await getNextCookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function removeSessionCookie() {
  const cookieStore = await getNextCookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
