import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const updateGlobalMedicineSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150).optional(),
  genericName: z.string().trim().max(150).nullable().optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  dosageForm: z.string().trim().max(100).nullable().optional(),
  strength: z.string().trim().max(100).nullable().optional(),
  manufacturer: z.string().trim().max(150).nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  sku: z.string().trim().max(64).nullable().optional(),
  prescriptionRequired: z.boolean().optional(),
  standardPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? null : Number(val)),
    z.number().nonnegative().nullable().optional()
  ),
  packageSize: z.string().trim().max(150).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  sideEffects: z.string().trim().max(2000).nullable().optional(),
  storageConditions: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid medicine identifier.' }, { status: 400 });
  }

  try {
    const item = await prisma.globalMedicine.findUnique({
      where: { id },
      include: {
        medicines: {
          select: {
            id: true,
            name: true,
            organization: {
              select: { id: true, name: true, code: true, city: true },
            },
          },
          take: 20,
        },
        _count: {
          select: { medicines: true },
        },
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'Global medicine not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error('Fetch global medicine error:', error);
    return NextResponse.json({ error: 'Failed to retrieve medicine record.' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid medicine identifier.' }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = updateGlobalMedicineSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid update payload.', details: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const existing = await prisma.globalMedicine.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: 'Global medicine record not found.' }, { status: 404 });
  }

  const data = validated.data;
  const updatePayload = {};

  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.genericName !== undefined) updatePayload.genericName = data.genericName || null;
  if (data.brand !== undefined) updatePayload.brand = data.brand || null;
  if (data.category !== undefined) updatePayload.category = data.category || null;
  if (data.dosageForm !== undefined) updatePayload.dosageForm = data.dosageForm || null;
  if (data.strength !== undefined) updatePayload.strength = data.strength || null;
  if (data.manufacturer !== undefined) updatePayload.manufacturer = data.manufacturer || null;
  if (data.prescriptionRequired !== undefined) updatePayload.prescriptionRequired = Boolean(data.prescriptionRequired);
  if (data.standardPrice !== undefined) updatePayload.standardPrice = data.standardPrice != null ? Number(data.standardPrice) : null;
  if (data.packageSize !== undefined) updatePayload.packageSize = data.packageSize || null;
  if (data.description !== undefined) updatePayload.description = data.description || null;
  if (data.sideEffects !== undefined) updatePayload.sideEffects = data.sideEffects || null;
  if (data.storageConditions !== undefined) updatePayload.storageConditions = data.storageConditions || null;
  if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl || null;
  if (data.isActive !== undefined) updatePayload.isActive = Boolean(data.isActive);

  // Check unique barcode if updated
  if (data.barcode !== undefined) {
    const newBarcode = data.barcode?.trim() || null;
    if (newBarcode && newBarcode !== existing.barcode) {
      const barcodeConflict = await prisma.globalMedicine.findUnique({
        where: { barcode: newBarcode },
      });
      if (barcodeConflict && barcodeConflict.id !== id) {
        return NextResponse.json(
          { error: `Barcode "${newBarcode}" is already used by "${barcodeConflict.name}".` },
          { status: 409 }
        );
      }
    }
    updatePayload.barcode = newBarcode;
  }

  // Check unique SKU if updated
  if (data.sku !== undefined) {
    const newSku = data.sku?.trim() || null;
    if (newSku && newSku !== existing.sku) {
      const skuConflict = await prisma.globalMedicine.findUnique({
        where: { sku: newSku },
      });
      if (skuConflict && skuConflict.id !== id) {
        return NextResponse.json(
          { error: `SKU "${newSku}" is already used by "${skuConflict.name}".` },
          { status: 409 }
        );
      }
    }
    updatePayload.sku = newSku;
  }

  try {
    const updated = await prisma.globalMedicine.update({
      where: { id },
      data: updatePayload,
    });

    await logPlatformAudit({
      action: 'GLOBAL_MEDICINE_UPDATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'GLOBAL_MEDICINE',
      entityId: id,
      details: {
        previous: {
          name: existing.name,
          category: existing.category,
          standardPrice: existing.standardPrice,
          isActive: existing.isActive,
        },
        updated: updatePayload,
      },
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error('Update global medicine error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update medicine.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Invalid medicine identifier.' }, { status: 400 });
  }

  try {
    const existing = await prisma.globalMedicine.findUnique({
      where: { id },
      include: {
        _count: {
          select: { medicines: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Global medicine record not found.' }, { status: 404 });
    }

    // If medicines are referencing it, disconnect them gracefully first
    if (existing._count.medicines > 0) {
      await prisma.medicine.updateMany({
        where: { globalMedicineId: id },
        data: { globalMedicineId: null },
      });
    }

    await prisma.globalMedicine.delete({
      where: { id },
    });

    await logPlatformAudit({
      action: 'GLOBAL_MEDICINE_DELETED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'GLOBAL_MEDICINE',
      entityId: id,
      details: {
        deletedMedicineName: existing.name,
        genericName: existing.genericName,
        barcode: existing.barcode,
        sku: existing.sku,
        pharmacyUsagesDisconnected: existing._count.medicines,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted "${existing.name}" from global catalog.`,
    });
  } catch (error) {
    console.error('Delete global medicine error:', error);
    return NextResponse.json({ error: 'Failed to delete global medicine.' }, { status: 500 });
  }
}
