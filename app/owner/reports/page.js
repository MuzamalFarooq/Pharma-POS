import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Download,
  Percent,
  ShoppingBag,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminDateFilter from '@/components/owner/AdminDateFilter';
import { getDateRangeFilter } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reports & Analytics - PharmaPulse Administration' };

export default async function ReportsPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const range = typeof params?.range === 'string' ? params.range : '30d';
  const dateFilter = getDateRangeFilter(range);

  const [
    totalPharmacies,
    approvedCount,
    rejectedCount,
    totalOrders,
    deliveredOrders,
    cancelledOrders,
    totalSalesAgg,
    topPharmacies,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({ where: { status: 'REJECTED' } }),
    prisma.customerOrder.count({ where: dateFilter ? { createdAt: dateFilter } : {} }),
    prisma.customerOrder.count({ where: { status: 'DELIVERED', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.customerOrder.count({ where: { status: 'CANCELLED', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
    }),
    prisma.organization.findMany({
      take: 8,
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        currency: true,
        _count: {
          select: { customerOrders: true, sales: true },
        },
        sales: {
          where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
          select: { total: true },
        },
      },
    }),
  ]);

  const approvalRate = totalPharmacies > 0 ? ((approvedCount / (approvedCount + rejectedCount || 1)) * 100).toFixed(1) : 100;
  const cancellationRate = totalOrders > 0 ? ((cancelledOrders / totalOrders) * 100).toFixed(1) : 0;
  const grossSalesVolume = totalSalesAgg._sum.total || 0;

  // Rank pharmacies by sales sum
  const rankedPharmacies = topPharmacies
    .map((p) => {
      const salesSum = p.sales.reduce((acc, s) => acc + (s.total || 0), 0);
      return {
        ...p,
        salesSum,
      };
    })
    .sort((a, b) => b.salesSum - a.salesSum);

  return (
    <div className="space-y-7">
      <AdminHeader
        title="Platform Reports & Business Intelligence"
        description="Detailed analytics on tenant onboarding velocity, order fulfillment conversion, cancellation ratios, and pharmacy performance."
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminDateFilter selected={range} />
            <a
              href="/api/owner/reports/export"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Download Report (CSV)
            </a>
          </div>
        }
      />

      {/* KPI Metric Ratios */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pharmacy Approval Rate</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <Percent className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{approvalRate}%</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {approvedCount} approved vs {rejectedCount} rejected
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Order Cancellation Rate</span>
            <span className="rounded-xl bg-rose-50 p-2 text-rose-700 ring-1 ring-rose-100">
              <XCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{cancellationRate}%</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {cancelledOrders} cancelled of {totalOrders} total orders
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivered Fulfillment</span>
            <span className="rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{deliveredOrders}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Successfully delivered orders in selected window
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">POS Sales Recorded</span>
            <span className="rounded-xl bg-violet-50 p-2 text-violet-700 ring-1 ring-violet-100">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(grossSalesVolume)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Authoritative sales volume in window
          </p>
        </div>
      </div>

      {/* Top Performing Pharmacies Ranking */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Pharmacy Performance Leaderboard</h2>
          <p className="text-[10px] text-slate-500">Top pharmacy tenants ranked by processed sales volume</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Rank</th>
                <th className="px-5 py-3">Pharmacy Name</th>
                <th className="px-5 py-3">Location</th>
                <th className="px-5 py-3">Online Orders</th>
                <th className="px-5 py-3">POS Transactions</th>
                <th className="px-5 py-3 text-right">Processed Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {rankedPharmacies.length > 0 ? (
                rankedPharmacies.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-400 font-mono">#{idx + 1}</td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/pharmacies/${p.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700"
                      >
                        {p.name}
                      </Link>
                      <p className="font-mono text-[10px] text-slate-400">{p.code}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{p.city || '—'}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{p._count.customerOrders} orders</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{p._count.sales} sales</td>
                    <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">
                      {formatCurrency(p.salesSum, p.currency)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No pharmacy performance data available for this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
