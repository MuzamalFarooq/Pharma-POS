import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const globalMedicineSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  genericName: z.string().trim().max(150).nullable().optional(),
  brand: z.string().trim().max(100).nullable().optional(),
  category: z.string().trim().max(100).nullable().optional(),
  dosageForm: z.string().trim().max(100).nullable().optional(),
  strength: z.string().trim().max(100).nullable().optional(),
  manufacturer: z.string().trim().max(150).nullable().optional(),
  barcode: z.string().trim().max(64).nullable().optional(),
  sku: z.string().trim().max(64).nullable().optional(),
  prescriptionRequired: z.boolean().default(false),
  standardPrice: z.preprocess((val) => (val === '' || val === null || val === undefined ? null : Number(val)), z.number().nonnegative().nullable().optional()),
  packageSize: z.string().trim().max(150).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
  sideEffects: z.string().trim().max(2000).nullable().optional(),
  storageConditions: z.string().trim().max(500).nullable().optional(),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  isActive: z.boolean().default(true),
});

export async function GET(request) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || 'ALL';
  const dosageForm = searchParams.get('dosageForm')?.trim() || 'ALL';
  const prescription = searchParams.get('prescription')?.trim() || 'ALL'; // ALL, RX, OTC
  const status = searchParams.get('status')?.trim() || 'ALL'; // ALL, ACTIVE, INACTIVE
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '25', 10)));
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
  const exportFormat = searchParams.get('format'); // 'csv' or null

  const whereClause = {
    ...(status !== 'ALL' ? { isActive: status === 'ACTIVE' } : {}),
    ...(category !== 'ALL' ? { category } : {}),
    ...(dosageForm !== 'ALL' ? { dosageForm } : {}),
    ...(prescription !== 'ALL' ? { prescriptionRequired: prescription === 'RX' } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { genericName: { contains: q, mode: 'insensitive' } },
            { brand: { contains: q, mode: 'insensitive' } },
            { manufacturer: { contains: q, mode: 'insensitive' } },
            { barcode: { contains: q, mode: 'insensitive' } },
            { sku: { contains: q, mode: 'insensitive' } },
            { category: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  try {
    if (exportFormat === 'csv') {
      const allItems = await prisma.globalMedicine.findMany({
        where: whereClause,
        orderBy: { [sortBy]: sortOrder },
      });

      const headers = [
        'ID',
        'Name',
        'Generic Formulation',
        'Brand',
        'Category',
        'Dosage Form',
        'Strength',
        'Manufacturer',
        'Barcode',
        'SKU',
        'Prescription Required',
        'Standard Price',
        'Package Size',
        'Storage Conditions',
        'Active Status',
        'Created At',
      ];

      const csvRows = [
        headers.join(','),
        ...allItems.map((item) =>
          [
            item.id,
            `"${(item.name || '').replace(/"/g, '""')}"`,
            `"${(item.genericName || '').replace(/"/g, '""')}"`,
            `"${(item.brand || '').replace(/"/g, '""')}"`,
            `"${(item.category || '').replace(/"/g, '""')}"`,
            `"${(item.dosageForm || '').replace(/"/g, '""')}"`,
            `"${(item.strength || '').replace(/"/g, '""')}"`,
            `"${(item.manufacturer || '').replace(/"/g, '""')}"`,
            `"${(item.barcode || '').replace(/"/g, '""')}"`,
            `"${(item.sku || '').replace(/"/g, '""')}"`,
            item.prescriptionRequired ? 'YES (Rx)' : 'NO (OTC)',
            item.standardPrice != null ? item.standardPrice.toFixed(2) : '',
            `"${(item.packageSize || '').replace(/"/g, '""')}"`,
            `"${(item.storageConditions || '').replace(/"/g, '""')}"`,
            item.isActive ? 'ACTIVE' : 'INACTIVE',
            item.createdAt.toISOString(),
          ].join(',')
        ),
      ];

      return new Response(csvRows.join('\n'), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="global-medicine-catalog-${Date.now()}.csv"`,
        },
      });
    }

    const [totalCount, items, stats, categoriesList, dosageFormsList] = await Promise.all([
      prisma.globalMedicine.count({ where: whereClause }),
      prisma.globalMedicine.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: { medicines: true },
          },
        },
      }),
      Promise.all([
        prisma.globalMedicine.count(),
        prisma.globalMedicine.count({ where: { isActive: true } }),
        prisma.globalMedicine.count({ where: { prescriptionRequired: true } }),
        prisma.globalMedicine.count({ where: { barcode: { not: null } } }),
      ]),
      prisma.globalMedicine.findMany({
        where: { category: { not: null } },
        select: { category: true },
        distinct: ['category'],
        orderBy: { category: 'asc' },
      }),
      prisma.globalMedicine.findMany({
        where: { dosageForm: { not: null } },
        select: { dosageForm: true },
        distinct: ['dosageForm'],
        orderBy: { dosageForm: 'asc' },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
      stats: {
        total: stats[0],
        active: stats[1],
        inactive: stats[0] - stats[1],
        prescription: stats[2],
        otc: stats[0] - stats[2],
        withBarcode: stats[3],
      },
      categories: categoriesList.map((c) => c.category).filter(Boolean),
      dosageForms: dosageFormsList.map((d) => d.dosageForm).filter(Boolean),
    });
  } catch (error) {
    console.error('Fetch global medicines error:', error);
    return NextResponse.json({ error: 'Failed to retrieve global medicine catalog.' }, { status: 500 });
  }
}

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

  const validated = globalMedicineSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid medicine details.', details: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = validated.data;

  // Clean empty strings to null
  const cleanedData = {
    name: data.name,
    genericName: data.genericName || null,
    brand: data.brand || null,
    category: data.category || null,
    dosageForm: data.dosageForm || null,
    strength: data.strength || null,
    manufacturer: data.manufacturer || null,
    barcode: data.barcode || null,
    sku: data.sku || null,
    prescriptionRequired: Boolean(data.prescriptionRequired),
    standardPrice: data.standardPrice != null ? Number(data.standardPrice) : null,
    packageSize: data.packageSize || null,
    description: data.description || null,
    sideEffects: data.sideEffects || null,
    storageConditions: data.storageConditions || null,
    imageUrl: data.imageUrl || null,
    isActive: data.isActive !== false,
  };

  try {
    // Check barcode conflict if provided
    if (cleanedData.barcode) {
      const existingBarcode = await prisma.globalMedicine.findUnique({
        where: { barcode: cleanedData.barcode },
      });
      if (existingBarcode) {
        return NextResponse.json(
          { error: `Barcode "${cleanedData.barcode}" is already registered to "${existingBarcode.name}".` },
          { status: 409 }
        );
      }
    }

    // Check SKU conflict if provided
    if (cleanedData.sku) {
      const existingSku = await prisma.globalMedicine.findUnique({
        where: { sku: cleanedData.sku },
      });
      if (existingSku) {
        return NextResponse.json(
          { error: `SKU "${cleanedData.sku}" is already registered to "${existingSku.name}".` },
          { status: 409 }
        );
      }
    }

    const created = await prisma.globalMedicine.create({
      data: cleanedData,
    });

    await logPlatformAudit({
      action: 'GLOBAL_MEDICINE_CREATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'GLOBAL_MEDICINE',
      entityId: created.id,
      details: {
        name: created.name,
        genericName: created.genericName,
        category: created.category,
        barcode: created.barcode,
        sku: created.sku,
        standardPrice: created.standardPrice,
        prescriptionRequired: created.prescriptionRequired,
      },
    });

    return NextResponse.json({ success: true, item: created });
  } catch (error) {
    console.error('Create global medicine error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create global medicine item.' }, { status: 500 });
  }
}
