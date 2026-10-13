import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const createAdminSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email(),
  role: z.enum(['ADMIN', 'SUPERVISOR', 'SUPPORT_SPECIALIST', 'COMPLIANCE_OFFICER', 'FINANCE_OFFICER']).default('ADMIN'),
  permissions: z.array(z.string()).default([]),
});

export async function POST(request) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = createAdminSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid admin data.', details: validated.error.flatten().fieldErrors }, { status: 400 });
  }

  const { name, email, role, permissions } = validated.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const existing = await prisma.platformAdmin.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json({ error: 'An administrator with this email already exists.' }, { status: 409 });
    }

    const admin = await prisma.platformAdmin.create({
      data: {
        name,
        email: normalizedEmail,
        role,
        permissions: JSON.stringify(permissions),
        status: 'ACTIVE',
      },
    });

    await logPlatformAudit({
      action: 'PLATFORM_ADMIN_CREATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'ADMIN',
      entityId: admin.id,
      details: {
        adminEmail: admin.email,
        adminName: admin.name,
        role,
        permissions,
      },
    });

    return NextResponse.json({ success: true, admin });
  } catch (error) {
    console.error('Create platform admin error:', error);
    return NextResponse.json({ error: 'Failed to create platform administrator.' }, { status: 500 });
  }
}
