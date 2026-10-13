import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const statusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  resolutionReason: z.string().trim().max(2000).optional(),
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

  const validated = statusSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 });
  }

  const { status, priority, resolutionReason } = validated.data;

  try {
    const existing = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    const updated = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(status ? { status } : {}),
        ...(priority ? { priority } : {}),
        ...(resolutionReason !== undefined ? { resolutionReason } : {}),
        ...(status === 'RESOLVED' || status === 'CLOSED' ? { resolvedAt: new Date() } : {}),
      },
    });

    await logPlatformAudit({
      action: 'SUPPORT_TICKET_UPDATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'TICKET',
      entityId: ticketId,
      organizationId: existing.organizationId,
      details: {
        ticketNumber: existing.ticketNumber,
        newStatus: status || existing.status,
        newPriority: priority || existing.priority,
        resolutionReason: resolutionReason || null,
      },
    });

    return NextResponse.json({ success: true, ticket: updated });
  } catch (error) {
    console.error('Update ticket status error:', error);
    return NextResponse.json({ error: 'Failed to update ticket.' }, { status: 500 });
  }
}
