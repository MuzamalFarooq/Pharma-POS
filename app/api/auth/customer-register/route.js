import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword, createSessionToken, setSessionCookie } from '@/lib/auth';
import { customerRegisterSchema } from '@/lib/validations';

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = customerRegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { fullName, email, password } = validated.data;
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: normalizedEmail,
        passwordHash: await hashPassword(password),
      },
      select: { id: true, name: true, email: true },
    });

    const token = await createSessionToken({ userId: user.id, role: 'CUSTOMER' });
    await setSessionCookie(token);

    return NextResponse.json({ success: true, user, role: 'CUSTOMER', redirect: '/customer' }, { status: 201 });
  } catch (error) {
    console.error('Customer registration API Error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
