import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

export async function GET(request) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  try {
    const [sales, orders] = await Promise.all([
      prisma.sale.findMany({
        take: 500,
        orderBy: { date: 'desc' },
        include: {
          organization: { select: { name: true, code: true } },
          customer: { select: { name: true } },
        },
      }),
      prisma.customerOrder.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { name: true, code: true } },
        },
      }),
    ]);

    // Format CSV
    const rows = [
      ['Transaction Type', 'Transaction ID', 'Pharmacy Name', 'Pharmacy Code', 'Date', 'Amount', 'Payment Method', 'Status'],
    ];

    sales.forEach((s) => {
      rows.push([
        'POS Sale',
        s.id,
        `"${s.organization.name.replace(/"/g, '""')}"`,
        s.organization.code,
        s.date.toISOString(),
        s.total,
        s.paymentMethod,
        s.status,
      ]);
    });

    orders.forEach((o) => {
      rows.push([
        'Online Order',
        o.id,
        `"${o.organization.name.replace(/"/g, '""')}"`,
        o.organization.code,
        o.createdAt.toISOString(),
        o.total,
        o.paymentMethod,
        o.status,
      ]);
    });

    const csvContent = rows.map((r) => r.join(',')).join('\n');

    await logPlatformAudit({
      action: 'FINANCIAL_REPORT_EXPORTED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'FINANCE',
      details: {
        exportedRows: rows.length - 1,
      },
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="pharmapulse-financial-export-${Date.now()}.csv"`,
      },
    });
  } catch (error) {
    console.error('Financial export error:', error);
    return NextResponse.json({ error: 'Failed to export financial records.' }, { status: 500 });
  }
}
