import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const catalogQuerySchema = z.object({
  branchId: z.string().min(1).optional(),
  search: z.string().trim().max(100).optional().default(''),
  categoryId: z.string().min(1).optional(),
  section: z.enum(['over-the-counter', 'prescribed', 'skin-hair', 'vitamins-supplements', 'women-health']).optional(),
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
});

const PAGE_SIZE = 50;
const sectionCategoryTerms = {
  'over-the-counter': ['over-the-counter', 'over the counter'],
  prescribed: ['prescribed', 'prescription'],
  'skin-hair': ['skin', 'hair', 'topical'],
  'vitamins-supplements': ['vitamin', 'supplement'],
  'women-health': ['women', 'woman', 'feminine', 'maternity', 'pregnancy', 'obstetric'],
};

export async function GET(request) {
  try {
    const query = catalogQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid catalog filters' }, { status: 400 });
    }

    const { branchId, search, categoryId, section, page } = query.data;
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
      const branchWithAvailableMedicine = {
        status: 'ACTIVE',
        batches: {
          some: {
            status: 'ACTIVE',
            expiryDate: { gt: new Date() },
            quantity: { gt: 0 },
            medicine: { isActive: true },
          },
        },
      };

      selectedBranch = await prisma.branch.findFirst({
        where: { ...branchWithAvailableMedicine, isMain: true },
        include: {
          organization: {
            select: { id: true, name: true, currency: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      if (!selectedBranch) {
        selectedBranch = await prisma.branch.findFirst({
          where: branchWithAvailableMedicine,
          include: {
            organization: {
              select: { id: true, name: true, currency: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      }

      if (!selectedBranch) {
        selectedBranch = await prisma.branch.findFirst({
          where: { status: 'ACTIVE', isMain: true },
          include: {
            organization: {
              select: { id: true, name: true, currency: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        });
      }

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

    const categories = await prisma.medicineCategory.findMany({
      where: {
        organizationId: selectedBranch.organizationId,
        medicines: { some: { isActive: true } },
      },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    const medicineFilters = [];
    if (categoryId) medicineFilters.push({ categoryId });
    if (section) {
      const matchingCategoryIds = categories
        .filter((category) => {
          const searchableName = `${category.name} ${category.description || ''}`.toLowerCase();
          return sectionCategoryTerms[section].some((term) => searchableName.includes(term));
        })
        .map((category) => category.id);

      medicineFilters.push({ categoryId: { in: matchingCategoryIds } });
    }

    const medicineWhere = {
      organizationId: selectedBranch.organizationId,
      isActive: true,
      ...(medicineFilters.length ? { AND: medicineFilters } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { genericName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [medicines, total, branches] = await Promise.all([
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
      prisma.branch.findMany({
        where: {
          status: 'ACTIVE',
          batches: {
            some: {
              status: 'ACTIVE',
              expiryDate: { gt: new Date() },
              quantity: { gt: 0 },
              medicine: { isActive: true },
            },
          },
        },
        select: {
          id: true,
          name: true,
          code: true,
          city: true,
          address: true,
          organization: { select: { name: true } },
        },
        orderBy: [{ organization: { name: 'asc' } }, { isMain: 'desc' }, { name: 'asc' }],
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
        imageUrl: medicine.imageUrl,
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
      branches: branches.map(({ organization, ...branch }) => ({
        ...branch,
        organizationName: organization.name,
      })),
      categories: categories.map(({ id, name }) => ({ id, name })),
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
