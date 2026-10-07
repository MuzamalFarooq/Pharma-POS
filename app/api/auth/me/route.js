import { NextResponse } from 'next/server';
import { getSession, createSessionToken, setSessionCookie } from '@/lib/auth';

export async function GET() {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: session.user,
    organization: session.activeOrganization,
    branch: session.activeBranch,
    role: session.role,
    memberships: session.memberships,
    branches: session.branches,
  });
}

export async function POST(req) {
  const session = await getSession();
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { organizationId, branchId } = body;

  if (!session.activeOrganization) {
    return NextResponse.json({ error: 'This account is not associated with a pharmacy organization' }, { status: 403 });
  }

  const targetOrgId = organizationId || session.activeOrganization.id;
  const targetMember = session.memberships.find((m) => m.organizationId === targetOrgId);

  if (!targetMember) {
    return NextResponse.json({ error: 'Unauthorized organization switch attempt' }, { status: 403 });
  }

  const token = await createSessionToken({
    userId: session.user.id,
    activeOrganizationId: targetOrgId,
    activeBranchId: branchId || session.activeBranch?.id || null,
    role: targetMember.role,
  });

  await setSessionCookie(token);

  return NextResponse.json({ success: true });
}
