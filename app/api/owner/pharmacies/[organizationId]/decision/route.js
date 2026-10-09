import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';

const decisionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'SUSPEND', 'REACTIVATE']),
  rejectionReason: z.string().trim().max(2000).optional().default(''),
});

const transitions = {
  APPROVE: { from: 'PENDING', to: 'ACTIVE', auditAction: 'PLATFORM_PHARMACY_APPROVED' },
  REJECT: { from: 'PENDING', to: 'REJECTED', auditAction: 'PLATFORM_PHARMACY_REJECTED' },
  SUSPEND: { from: 'ACTIVE', to: 'SUSPENDED', auditAction: 'PLATFORM_PHARMACY_SUSPENDED' },
  REACTIVATE: { from: 'SUSPENDED', to: 'ACTIVE', auditAction: 'PLATFORM_PHARMACY_REACTIVATED' },
};

const resultMessages = {
  APPROVE: 'Pharmacy approved. The owner can now access the pharmacy dashboard.',
  REJECT: 'Pharmacy request rejected.',
  SUSPEND: 'Pharmacy access suspended.',
  REACTIVATE: 'Pharmacy access reactivated.',
};

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

  const validated = decisionSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid pharmacy status action.' }, { status: 400 });
  }

  const { action, rejectionReason } = validated.data;
  const transition = transitions[action];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const pharmacy = await tx.organization.findUnique({
        where: { id: organizationId },
        select: { id: true, name: true, status: true, approvedAt: true },
      });
      if (!pharmacy) return { status: 404, error: 'Pharmacy not found.' };
      if (action === 'APPROVE' && pharmacy.status === 'ACTIVE' && pharmacy.approvedAt) {
        return { status: 200, alreadyCompleted: true };
      }
      if (pharmacy.status !== transition.from) {
        return { status: 409, error: `Pharmacy must be ${transition.from.toLowerCase()} before this action.` };
      }

      if (action === 'APPROVE') {
        const pendingOwner = await tx.organizationMember.findFirst({
          where: { organizationId, role: 'OWNER', status: 'INVITED' },
          select: { id: true },
        });
        if (!pendingOwner) {
          return { status: 409, error: 'No pending pharmacy owner membership is available to activate.' };
        }
      }

      const updated = await tx.organization.updateMany({
        where: { id: organizationId, status: transition.from },
        data: {
          status: transition.to,
          ...(action === 'APPROVE'
            ? {
                approvedByUserId: session.user.id,
                approvedAt: new Date(),
                rejectedByUserId: null,
                rejectedAt: null,
                rejectionReason: null,
              }
            : {}),
          ...(action === 'REJECT'
            ? {
                rejectedByUserId: session.user.id,
                rejectedAt: new Date(),
                rejectionReason: rejectionReason || null,
              }
            : {}),
        },
      });
      if (updated.count !== 1) {
        const latestPharmacy = action === 'APPROVE'
          ? await tx.organization.findUnique({
              where: { id: organizationId },
              select: { status: true, approvedAt: true },
            })
          : null;
        if (latestPharmacy?.status === 'ACTIVE' && latestPharmacy.approvedAt) {
          return { status: 200, alreadyCompleted: true };
        }
        return { status: 409, error: 'Pharmacy status changed before this action could be completed.' };
      }

      if (action === 'APPROVE') {
        await tx.organizationMember.updateMany({
          where: { organizationId, role: 'OWNER', status: 'INVITED' },
          data: { status: 'ACTIVE' },
        });
      } else if (action === 'REJECT') {
        await tx.organizationMember.updateMany({
          where: { organizationId, status: 'INVITED' },
          data: { status: 'DISABLED' },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId,
          userId: session.user.id,
          action: transition.auditAction,
          entity: 'Organization',
          entityId: organizationId,
          metadata: JSON.stringify({
            pharmacyName: pharmacy.name,
            from: transition.from,
            to: transition.to,
            ...(action === 'REJECT' ? { rejectionReason: rejectionReason || null } : {}),
          }),
        },
      });

      return { status: 200 };
    });

    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    if (result.alreadyCompleted) {
      return NextResponse.json({ success: true, message: 'Pharmacy is already approved.' });
    }

    revalidatePath('/owner');
    revalidatePath('/owner/pharmacies');
    revalidatePath('/owner/pharmacy-requests');
    revalidatePath(`/owner/pharmacies/${organizationId}`);
    return NextResponse.json({ success: true, message: resultMessages[action] });
  } catch (error) {
    console.error('Platform pharmacy decision error:', error);
    return NextResponse.json({ error: 'Unable to update pharmacy status.' }, { status: 500 });
  }
}
