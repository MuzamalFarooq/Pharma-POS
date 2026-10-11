import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, removeSessionCookie } from '@/lib/auth';
import { resetPasswordSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp, hashResetToken } from '@/lib/security';
import { sendPasswordChangeConfirmationEmail } from '@/lib/email';
import { logAuditEvent } from '@/lib/tenant';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string' || token.length < 10) {
      return NextResponse.json(
        { valid: false, error: 'Invalid or missing password reset token.' },
        { status: 400 }
      );
    }

    const tokenHash = hashResetToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: {
        id: true,
        expiresAt: true,
        usedAt: true,
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { valid: false, error: 'Invalid password reset link.' },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt !== null) {
      return NextResponse.json(
        { valid: false, error: 'This password reset link has already been used.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json(
        { valid: false, error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('[Reset Password Verification] Error:', error);
    return NextResponse.json(
      { valid: false, error: 'Unable to verify reset token.' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit per IP: 10 attempts per 15 minutes
    const ipLimit = checkRateLimit(`reset:ip:${clientIp}`, 10, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset attempts. Please try again in ${ipLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const validated = resetPasswordSchema.safeParse(body);

    if (!validated.success) {
      const errorMsg = validated.error.errors[0]?.message || 'Invalid input data';
      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

    const { token, password } = validated.data;
    const tokenHash = hashResetToken(token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            memberships: {
              where: { status: 'ACTIVE' },
              select: { organizationId: true, branchId: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'Invalid or unrecognized password reset token.' },
        { status: 400 }
      );
    }

    if (resetRecord.usedAt !== null) {
      return NextResponse.json(
        { error: 'This password reset link has already been used. Please request a new one.' },
        { status: 400 }
      );
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json(
        { error: 'This password reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    const user = resetRecord.user;
    if (!user) {
      return NextResponse.json(
        { error: 'Account associated with this token could not be found.' },
        { status: 400 }
      );
    }

    // Hash the new password using project standard bcrypt
    const hashedPassword = await hashPassword(password);
    const now = new Date();

    // Atomic transaction: update password, record timestamp, invalidate this and all outstanding tokens
    await prisma.$transaction(async (tx) => {
      // 1. Update user password and session invalidation timestamp
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashedPassword,
          passwordChangedAt: now,
          passwordVersion: { increment: 1 },
        },
      });

      // 2. Mark this token as used
      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          usedAt: now,
        },
      });

      // 3. Invalidate any other outstanding tokens for this user
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      });
    });

    // Invalidate existing sessions for the browser (do not auto-login)
    await removeSessionCookie();

    // Log audit event if user is tied to an organization
    const activeMembership = user.memberships?.[0];
    if (activeMembership?.organizationId) {
      await logAuditEvent({
        organizationId: activeMembership.organizationId,
        branchId: activeMembership.branchId,
        userId: user.id,
        action: 'PASSWORD_RESET',
        entity: 'User',
        entityId: user.id,
        metadata: { clientIp },
      });
    }

    // Send confirmation email
    try {
      await sendPasswordChangeConfirmationEmail({
        to: user.email,
        name: user.name,
      });
    } catch (emailError) {
      console.error('[Reset Password] Failed to send confirmation email:', emailError.message);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. Please sign in with your new password.',
    });
  } catch (error) {
    console.error('[Reset Password] Processing error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password. Please try again.' },
      { status: 500 }
    );
  }
}
