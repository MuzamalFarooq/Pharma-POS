import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';
import { standardGlobalMedicines } from '@/scripts/seed-global-catalog';

const bulkActionSchema = z.object({
  action: z.enum(['ACTIVATE', 'DEACTIVATE', 'DELETE', 'SEED_STANDARDS']),
  ids: z.array(z.string()).optional().default([]),
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

  const validated = bulkActionSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid bulk action request.', details: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { action, ids } = validated.data;

  try {
    if (action === 'SEED_STANDARDS') {
      let created = 0;
      let updated = 0;

      for (const item of standardGlobalMedicines) {
        const existing = await prisma.globalMedicine.findFirst({
          where: {
            OR: [
              ...(item.barcode ? [{ barcode: item.barcode }] : []),
              ...(item.sku ? [{ sku: item.sku }] : []),
              { name: item.name },
            ],
          },
        });

        if (existing) {
          await prisma.globalMedicine.update({
            where: { id: existing.id },
            data: item,
          });
          updated++;
        } else {
          await prisma.globalMedicine.create({
            data: item,
          });
          created++;
        }
      }

      await logPlatformAudit({
        action: 'GLOBAL_CATALOG_STANDARDS_SEEDED',
        actorEmail: session.user.email,
        actorName: session.user.name,
        entityType: 'GLOBAL_CATALOG',
        details: { created, updated, total: standardGlobalMedicines.length },
      });

      return NextResponse.json({
        success: true,
        message: `Standard formulary loaded: ${created} new items added, ${updated} updated.`,
      });
    }

    if (!ids || ids.length === 0) {
      return NextResponse.json({ error: 'No medicine items selected for bulk operation.' }, { status: 400 });
    }

    if (action === 'ACTIVATE') {
      const res = await prisma.globalMedicine.updateMany({
        where: { id: { in: ids } },
        data: { isActive: true },
      });

      await logPlatformAudit({
        action: 'GLOBAL_MEDICINES_BULK_ACTIVATE',
        actorEmail: session.user.email,
        actorName: session.user.name,
        entityType: 'GLOBAL_MEDICINE',
        details: { count: res.count, affectedIds: ids },
      });

      return NextResponse.json({
        success: true,
        message: `Activated ${res.count} medicine catalog items.`,
      });
    }

    if (action === 'DEACTIVATE') {
      const res = await prisma.globalMedicine.updateMany({
        where: { id: { in: ids } },
        data: { isActive: false },
      });

      await logPlatformAudit({
        action: 'GLOBAL_MEDICINES_BULK_DEACTIVATE',
        actorEmail: session.user.email,
        actorName: session.user.name,
        entityType: 'GLOBAL_MEDICINE',
        details: { count: res.count, affectedIds: ids },
      });

      return NextResponse.json({
        success: true,
        message: `Deactivated ${res.count} medicine catalog items.`,
      });
    }

    if (action === 'DELETE') {
      // Disconnect referencing pharmacy medicines first
      await prisma.medicine.updateMany({
        where: { globalMedicineId: { in: ids } },
        data: { globalMedicineId: null },
      });

      const res = await prisma.globalMedicine.deleteMany({
        where: { id: { in: ids } },
      });

      await logPlatformAudit({
        action: 'GLOBAL_MEDICINES_BULK_DELETE',
        actorEmail: session.user.email,
        actorName: session.user.name,
        entityType: 'GLOBAL_MEDICINE',
        details: { count: res.count, deletedIds: ids },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${res.count} medicine catalog items.`,
      });
    }

    return NextResponse.json({ error: 'Unrecognized action.' }, { status: 400 });
  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: error.message || 'Bulk operation failed.' }, { status: 500 });
  }
}
