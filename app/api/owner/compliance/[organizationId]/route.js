import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const complianceSchema = z.object({
  status: z.enum(['VERIFIED', 'PENDING_REVIEW', 'EXPIRED', 'REJECTED']),
  licenseNumber: z.string().trim().max(100).optional(),
  expiryDate: z.string().optional(),
  notes: z.string().trim().max(2000).optional().default(''),
});

export async function POST(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { organizationId } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = complianceSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid compliance data.', details: validated.error.flatten().fieldErrors }, { status: 400 });
  }

  const { status, licenseNumber, expiryDate, notes } = validated.data;

  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, licenseNumber: true },
    });

    if (!org) {
      return NextResponse.json({ error: 'Pharmacy not found.' }, { status: 404 });
    }

    const record = await prisma.complianceRecord.create({
      data: {
        organizationId,
        licenseNumber: licenseNumber || org.licenseNumber,
        status,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        notes,
        reviewedBy: session.user.email,
        reviewedAt: new Date(),
      },
    });

    if (licenseNumber && licenseNumber !== org.licenseNumber) {
      await prisma.organization.update({
        where: { id: organizationId },
        data: { licenseNumber },
      });
    }

    await logPlatformAudit({
      action: 'COMPLIANCE_RECORD_UPDATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'COMPLIANCE',
      entityId: record.id,
      organizationId,
      details: {
        pharmacyName: org.name,
        status,
        licenseNumber: licenseNumber || org.licenseNumber,
        notes,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error) {
    console.error('Update compliance record error:', error);
    return NextResponse.json({ error: 'Failed to update compliance record.' }, { status: 500 });
  }
}
