import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const catalogQuerySchema = z.object({
  branchId: z.string().min(1).optional(),
  search: z.string().trim().max(100).optional().default(''),
  categoryId: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
});

const PAGE_SIZE = 50;

export async function GET(request) {
  try {
    const query = catalogQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid catalog filters' }, { status: 400 });
    }

    const { branchId, search, categoryId, page } = query.data;
    let selectedBranch;

    if (branchId) {
      selectedBranch = await prisma.branch.findFirst({
        where: { id: branchId, status: 'ACTIVE' },
        include: {
          organization: {
            select: { id: true, name: true, currency: true },
          },
        },
      });

      if (!selectedBranch) {
        return NextResponse.json({ error: 'Selected pharmacy branch was not found or is inactive.' }, { status: 404 });
      }
    } else {
      selectedBranch = await prisma.branch.findFirst({
        where: { status: 'ACTIVE', isMain: true },
        include: {
          organization: {
            select: { id: true, name: true, currency: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!selectedBranch) {
        selectedBranch = await prisma.branch.findFirst({
          where: { status: 'ACTIVE' },
          include: {
            organization: {
              select: { id: true, name: true, currency: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      }
    }

    if (!selectedBranch) {
      return NextResponse.json({
        branch: null,
        branches: [],
        categories: [],
        medicines: [],
        pagination: { page, pageSize: PAGE_SIZE, total: 0, hasMore: false },
      });
    }

    const medicineWhere = {
      organizationId: selectedBranch.organizationId,
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { genericName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [medicines, total, categories, branches] = await Promise.all([
      prisma.medicine.findMany({
        where: medicineWhere,
        include: {
          category: { select: { id: true, name: true } },
          batches: {
            where: {
              branchId: selectedBranch.id,
              status: 'ACTIVE',
              expiryDate: { gt: new Date() },
              quantity: { gt: 0 },
            },
            select: { id: true, quantity: true, sellingPrice: true },
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.medicine.count({ where: medicineWhere }),
      prisma.medicineCategory.findMany({
        where: {
          organizationId: selectedBranch.organizationId,
          medicines: { some: { isActive: true } },
        },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
      prisma.branch.findMany({
        where: { organizationId: selectedBranch.organizationId, status: 'ACTIVE' },
        select: { id: true, name: true, code: true, city: true, address: true },
        orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
      }),
    ]);

    const branchMedicines = medicines.map((medicine) => {
      const availableStock = medicine.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const price = medicine.batches.length
        ? Math.min(...medicine.batches.map((batch) => Number(batch.sellingPrice)))
        : 0;

      return {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        description: medicine.description,
        brand: medicine.brand,
        manufacturer: medicine.manufacturer,
        prescriptionRequired: medicine.prescriptionRequired,
        category: medicine.category,
        price,
        availableStock,
        inStock: availableStock > 0,
      };
    });

    return NextResponse.json({
      branch: {
        id: selectedBranch.id,
        name: selectedBranch.name,
        code: selectedBranch.code,
        city: selectedBranch.city,
        address: selectedBranch.address,
        organizationName: selectedBranch.organization.name,
      },
      branches,
      categories,
      currency: selectedBranch.organization.currency || 'USD',
      medicines: branchMedicines,
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total,
        hasMore: page * PAGE_SIZE < total,
      },
    });
  } catch (error) {
    console.error('Customer medicines API error:', error);
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 });
  }
}
