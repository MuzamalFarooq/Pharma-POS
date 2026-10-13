import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const createTicketSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(['ORDER_DISPUTE', 'REFUND_REQUEST', 'PHARMACY_SUPPORT', 'TECHNICAL_ISSUE', 'GENERAL']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  organizationId: z.string().trim().optional().or(z.literal('')).transform((v) => v || null),
  customerEmail: z.string().trim().email().optional().or(z.literal('')).transform((v) => v || null),
  customerName: z.string().trim().max(100).optional().or(z.literal('')).transform((v) => v || null),
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

  const validated = createTicketSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid ticket fields.', details: validated.error.flatten().fieldErrors }, { status: 400 });
  }

  const { subject, description, category, priority, organizationId, customerEmail, customerName } = validated.data;
  const ticketNumber = `TIC-${Date.now().toString().slice(-6)}`;

  try {
    let pharmacyName = null;
    if (organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true },
      });
      if (org) pharmacyName = org.name;
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject,
        description,
        category,
        priority,
        organizationId,
        pharmacyName,
        customerEmail,
        customerName,
        assignedTo: session.user.name,
      },
    });

    await logPlatformAudit({
      action: 'SUPPORT_TICKET_CREATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'TICKET',
      entityId: ticket.id,
      organizationId,
      details: {
        ticketNumber,
        subject,
        category,
        priority,
      },
    });

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Create support ticket error:', error);
    return NextResponse.json({ error: 'Failed to create support ticket.' }, { status: 500 });
  }
}
