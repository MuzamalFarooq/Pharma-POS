import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');
    const organizationId = searchParams.get('organizationId');
    const search = searchParams.get('search')?.trim() || '';

    let selectedBranch = null;

    if (branchId) {
      selectedBranch = await prisma.branch.findUnique({
        where: { id: branchId },
        include: { organization: true },
      });
    } else if (organizationId) {
      selectedBranch = await prisma.branch.findFirst({
        where: {
          organizationId,
          status: 'ACTIVE',
          isMain: true,
        },
        include: { organization: true },
      });
    }

    if (!selectedBranch) {
      selectedBranch = await prisma.branch.findFirst({
        where: { status: 'ACTIVE' },
        include: { organization: true },
        orderBy: { createdAt: 'asc' },
      });
    }

    if (!selectedBranch) {
      return NextResponse.json({ branch: null, medicines: [] });
    }

    const medicines = await prisma.medicine.findMany({
      where: {
        organizationId: selectedBranch.organizationId,
        isActive: true,
        ...(search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      include: {
        category: true,
        batches: {
          where: {
            branchId: selectedBranch.id,
            status: 'ACTIVE',
            expiryDate: { gt: new Date() },
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const branchMedicines = medicines.map((medicine) => {
      const activeBatches = medicine.batches.filter((batch) => batch.quantity > 0);
      const availableStock = activeBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      const price = activeBatches.length > 0 ? Math.min(...activeBatches.map((batch) => Number(batch.sellingPrice))) : 0;

      return {
        id: medicine.id,
        name: medicine.name,
        genericName: medicine.genericName,
        dosageForm: medicine.dosageForm,
        strength: medicine.strength,
        description: medicine.description,
        brand: medicine.brand,
        prescriptionRequired: medicine.prescriptionRequired,
        category: medicine.category,
        price,
        availableStock,
        inStock: availableStock > 0,
        batches: activeBatches.map((batch) => ({
          id: batch.id,
          batchNumber: batch.batchNumber,
          quantity: batch.quantity,
          price: Number(batch.sellingPrice),
          expiryDate: batch.expiryDate,
        })),
      };
    });

    const branches = await prisma.branch.findMany({
      where: { organizationId: selectedBranch.organizationId, status: 'ACTIVE' },
      select: { id: true, name: true, code: true, city: true, address: true },
      orderBy: { isMain: 'desc' },
    });

    return NextResponse.json({
      branch: {
        id: selectedBranch.id,
        name: selectedBranch.name,
        code: selectedBranch.code,
        city: selectedBranch.city,
        address: selectedBranch.address,
        organizationId: selectedBranch.organizationId,
        organizationName: selectedBranch.organization.name,
      },
      branches,
      medicines: branchMedicines,
    });
  } catch (error) {
    console.error('Customer medicines API error:', error);
    return NextResponse.json({ error: 'Failed to load medicines' }, { status: 500 });
  }
}
