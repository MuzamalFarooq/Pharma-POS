import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { generateResetToken, hashResetToken } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email';
import { logPlatformAudit } from '@/lib/platform-audit';

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { userId } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    // Invalidate existing unused tokens
    await prisma.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Create 15-minute token
    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        userAgent: 'Platform Owner Administration',
      },
    });

    // Send email dispatch
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      rawToken,
    });

    await logPlatformAudit({
      action: 'ADMIN_TRIGGERED_PASSWORD_RESET',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'USER',
      entityId: user.id,
      details: {
        targetUserEmail: user.email,
        emailDeliverySuccess: emailResult.success,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Password reset link generated and dispatched to ${user.email}.`,
    });
  } catch (error) {
    console.error('Password reset initiation error:', error);
    return NextResponse.json({ error: 'Failed to initiate password reset.' }, { status: 500 });
  }
}
