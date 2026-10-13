import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const statusSchema = z.object({
  action: z.enum(['SUSPEND', 'REACTIVATE']),
  reason: z.string().trim().max(1000).optional().default(''),
});

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { userId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validated = statusSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid action payload.' }, { status: 400 });
  }

  const { action, reason } = validated.data;
  const targetMemberStatus = action === 'SUSPEND' ? 'DISABLED' : 'ACTIVE';

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Update user's memberships and bump passwordVersion if suspended to invalidate active sessions
    await prisma.$transaction(async (tx) => {
      await tx.organizationMember.updateMany({
        where: { userId },
        data: { status: targetMemberStatus },
      });

      if (action === 'SUSPEND') {
        await tx.user.update({
          where: { id: userId },
          data: { passwordVersion: { increment: 1 } },
        });
      }
    });

    await logPlatformAudit({
      action: action === 'SUSPEND' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'USER',
      entityId: userId,
      details: {
        targetUserEmail: user.email,
        targetUserName: user.name,
        action,
        reason: reason || null,
      },
    });

    return NextResponse.json({
      success: true,
      message: action === 'SUSPEND' ? 'User access suspended successfully.' : 'User access reactivated successfully.',
    });
  } catch (error) {
    console.error('Update user status error:', error);
    return NextResponse.json({ error: 'Failed to update user status.' }, { status: 500 });
  }
}
