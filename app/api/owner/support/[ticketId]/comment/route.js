import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';

const commentSchema = z.object({
  message: z.string().trim().min(1).max(5000),
  isInternal: z.boolean().default(true),
});

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { ticketId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = commentSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Comment message is required.' }, { status: 400 });
  }

  const { message, isInternal } = validated.data;

  try {
    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorName: session.user.name || 'Platform Owner',
        authorRole: 'PLATFORM_OWNER',
        message,
        isInternal,
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('Add ticket comment error:', error);
    return NextResponse.json({ error: 'Failed to add comment.' }, { status: 500 });
  }
}
