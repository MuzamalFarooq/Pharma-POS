import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext } from '@/lib/tenant';
import { PERMISSIONS } from '@/lib/rbac';

export async function GET(request) {
  const tenant = await getTenantContext(PERMISSIONS.INVENTORY_READ);
  if (tenant.error) {
    return NextResponse.json({ error: tenant.error }, { status: tenant.status });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.trim() || '';

  if (!q || q.length < 2) {
    return NextResponse.json({ items: [] });
  }

  try {
    const items = await prisma.globalMedicine.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { genericName: { contains: q, mode: 'insensitive' } },
          { brand: { contains: q, mode: 'insensitive' } },
          { barcode: { contains: q, mode: 'insensitive' } },
          { sku: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Global search error:', error);
    return NextResponse.json({ error: 'Failed to search global catalog' }, { status: 500 });
  }
}
