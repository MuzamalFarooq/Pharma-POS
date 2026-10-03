import Link from 'next/link';
import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import { formatCurrency, formatDate, calculateExpiryStatus } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Pill,
  AlertTriangle,
  Clock,
  Users,
  Building,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Package,
} from 'lucide-react';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Dashboard - PharmaPulse SaaS',
};

export default async function DashboardPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;

  const { organizationId, branchId, organization, branch } = tenant;

  // 1. Fetch Today's Sales & Invoices
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const todaySales = await prisma.sale.findMany({
    where: {
      organizationId,
      branchId: branchId || undefined,
      createdAt: { gte: startOfToday },
      status: 'COMPLETED',
    },
    include: {
      items: true,
    },
  });

  const todayRevenue = todaySales.reduce((acc, sale) => acc + sale.total, 0);

  // 2. Counts
  const totalMedicinesCount = await prisma.medicine.count({
    where: { organizationId, isActive: true },
  });

  const allBatches = await prisma.medicineBatch.findMany({
    where: { organizationId, branchId: branchId || undefined, status: 'ACTIVE' },
    include: { medicine: true },
  });

  // Calculate low stock & expiring stock
  const lowStockBatches = allBatches.filter((b) => b.quantity <= b.minStock);

  const expiringSoonBatches = allBatches.filter((b) => {
    const expStatus = calculateExpiryStatus(b.expiryDate);
    return expStatus.status === 'EXPIRED' || expStatus.status === 'CRITICAL' || expStatus.status === 'WARNING';
  });

  // 3. Recent 5 Sales
  const recentSales = await prisma.sale.findMany({
    where: { organizationId, branchId: branchId || undefined },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      cashier: { select: { name: true } },
      customer: { select: { name: true } },
      items: { include: { medicine: { select: { name: true } } } },
    },
  });

  // 4. Sales over last 7 days for chart
  const last7DaysSales = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);

    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const daySales = await prisma.sale.findMany({
      where: {
        organizationId,
        branchId: branchId || undefined,
        createdAt: { gte: d, lt: nextD },
        status: 'COMPLETED',
      },
    });

    const dayRevenue = daySales.reduce((sum, s) => sum + s.total, 0);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    last7DaysSales.push({
      day: dayLabel,
      revenue: parseFloat(dayRevenue.toFixed(2)),
      count: daySales.length,
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8 pb-12 w-full max-w-full min-w-0">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">Pharmacy Operations Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics for <strong className="text-slate-800">{organization?.name}</strong> • Active Branch:{' '}
            <strong className="text-slate-800">{branch?.name || 'All Branches'}</strong>
          </p>
        </div>

        {/* QUICK ACTIONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/pos"
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
          >
            <ShoppingCart className="w-4 h-4" /> New POS Sale
          </Link>
          <Link
            href="/medicines"
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Add Medicine
          </Link>
          <Link
            href="/purchases"
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Create Purchase
          </Link>
        </div>
      </div>

      {/* METRIC CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{formatCurrency(todayRevenue, organization?.currency)}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{todaySales.length} Completed Invoices Today</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Medicines</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Pill className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{totalMedicinesCount} Products</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{allBatches.length} Inventory Batches</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Low Stock Warnings</span>
            <div className={`p-2 rounded-xl ${lowStockBatches.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600">{lowStockBatches.length} Batches</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Below reorder min threshold</div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Expiring / Expired</span>
            <div className={`p-2 rounded-xl ${expiringSoonBatches.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600">{expiringSoonBatches.length} Batches</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Expiring within 30-90 days</div>
          </div>
        </div>
      </div>

      <DashboardCharts chartData={last7DaysSales} currency={organization?.currency} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 min-w-0 w-full overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Sales & Invoices</h2>
              <p className="text-xs text-slate-500">Latest transactions generated at POS</p>
            </div>
            <Link href="/sales" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3">Sale Ref</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Items</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recentSales.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No sales transactions recorded today yet.
                    </td>
                  </tr>
                ) : (
                  recentSales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-bold text-emerald-700">{sale.saleNumber}</td>
                      <td className="py-3 px-3 text-slate-900">{sale.customer?.name || 'Walk-in Customer'}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(sale.createdAt)}</td>
                      <td className="py-3 px-3">{sale.items.length} items</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                          {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatCurrency(sale.total, organization?.currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Low Stock Medicines</h3>
              </div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                {lowStockBatches.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {lowStockBatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All inventory levels are healthy.</p>
              ) : (
                lowStockBatches.slice(0, 4).map((b) => (
                  <div key={b.id} className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900">{b.medicine?.name}</div>
                      <div className="text-[10px] text-slate-500">Batch: {b.batchNumber}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-amber-700">{b.quantity} left</div>
                      <div className="text-[10px] text-slate-400">Min: {b.minStock}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <Link href="/inventory" className="block text-center text-xs font-bold text-emerald-600 hover:underline pt-1">
              Manage Inventory Stock →
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm font-bold text-slate-900">Expiring Batches</h3>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {expiringSoonBatches.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {expiringSoonBatches.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No batches expiring within 90 days.</p>
              ) : (
                expiringSoonBatches.slice(0, 4).map((b) => {
                  const status = calculateExpiryStatus(b.expiryDate);
                  return (
                    <div key={b.id} className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{b.medicine?.name}</div>
                        <div className="text-[10px] text-slate-500">Exp: {formatDate(b.expiryDate)}</div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                          {status.label}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <Link href="/inventory" className="block text-center text-xs font-bold text-emerald-600 hover:underline pt-1">
              View All Expiring Batches →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
