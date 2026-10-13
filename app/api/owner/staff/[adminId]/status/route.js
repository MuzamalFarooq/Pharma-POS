import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const statusSchema = z.object({
  status: z.enum(['ACTIVE', 'DISABLED']),
});

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { adminId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = statusSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
  }

  const { status } = validated.data;

  try {
    const admin = await prisma.platformAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Administrator not found.' }, { status: 404 });
    }

    const updated = await prisma.platformAdmin.update({
      where: { id: adminId },
      data: { status },
    });

    await logPlatformAudit({
      action: status === 'ACTIVE' ? 'PLATFORM_ADMIN_ACTIVATED' : 'PLATFORM_ADMIN_DISABLED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'ADMIN',
      entityId: admin.id,
      details: {
        adminEmail: admin.email,
        status,
      },
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch (error) {
    console.error('Update platform admin status error:', error);
    return NextResponse.json({ error: 'Failed to update administrator status.' }, { status: 500 });
  }
}
