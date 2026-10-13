import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

export async function GET() {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  try {
    const pharmacies = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            medicines: true,
            customerOrders: true,
            sales: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const rows = [
      ['Pharmacy Name', 'Code', 'Status', 'Registered Date', 'Medicines Count', 'Customer Orders Count', 'POS Sales Count'],
    ];

    pharmacies.forEach((p) => {
      rows.push([
        `"${p.name.replace(/"/g, '""')}"`,
        p.code,
        p.status,
        p.createdAt.toISOString(),
        p._count.medicines,
        p._count.customerOrders,
        p._count.sales,
      ]);
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');

    await logPlatformAudit({
      action: 'PLATFORM_REPORTS_EXPORTED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'REPORTS',
      details: {
        exportedPharmaciesCount: pharmacies.length,
      },
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pharmapulse-platform-report-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Report export error:', error);
    return NextResponse.json({ error: 'Failed to export platform report.' }, { status: 500 });
  }
}
