import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { forgotPasswordSchema } from '@/lib/validations';
import { checkRateLimit, getClientIp, generateResetToken, hashResetToken } from '@/lib/security';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit per IP: 5 attempts per 15 minutes
    const ipLimit = checkRateLimit(`forgot:ip:${clientIp}`, 5, 15 * 60 * 1000);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests from this network. Please try again in ${ipLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const validated = forgotPasswordSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    const normalizedEmail = validated.data.email.toLowerCase().trim();

    // Rate limit per Email: 3 attempts per 15 minutes
    const emailLimit = checkRateLimit(`forgot:email:${normalizedEmail}`, 3, 15 * 60 * 1000);
    if (!emailLimit.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests for this email. Please try again in ${emailLimit.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Generic response message to prevent account enumeration
    const genericResponse = {
      success: true,
      message: 'If an account exists with this email address, password reset instructions have been sent.',
    };

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    // Account enumeration protection: Return generic message if user not found
    if (!user) {
      return NextResponse.json(genericResponse);
    }

    // Invalidate any previously issued unused tokens for this user
    await prisma.passwordResetToken.updateMany({
      where: {
        userId: user.id,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });

    // Generate unguessable 256-bit random token
    const rawToken = generateResetToken();
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const userAgent = req.headers.get('user-agent')?.substring(0, 255) || null;

    // Store ONLY the SHA-256 hash in database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
        ipAddress: clientIp,
        userAgent,
      },
    });

    // Send email with raw token
    try {
      await sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        rawToken,
      });
    } catch (emailError) {
      console.error('[Forgot Password] Email delivery error:', emailError.message);
      // We do not leak internal email dispatch errors to attackers
    }

    return NextResponse.json(genericResponse);
  } catch (error) {
    console.error('[Forgot Password] Internal error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}
