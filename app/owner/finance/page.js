import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  DollarSign,
  Download,
  Receipt,
  Scale,
  TrendingUp,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminDateFilter from '@/components/owner/AdminDateFilter';
import { getDateRangeFilter } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Finance & Revenue - PharmaPulse Administration' };

export default async function FinancePage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const range = typeof params?.range === 'string' ? params.range : '30d';
  const dateFilter = getDateRangeFilter(range);

  // Parallel financial queries
  const [
    customerOrdersAgg,
    posSalesAgg,
    refundSalesAgg,
    discountsAgg,
    pharmacies,
    recentSales,
    recentInvoices,
  ] = await Promise.all([
    prisma.customerOrder.aggregate({
      where: { status: { not: 'CANCELLED' }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true, subtotal: true, tax: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { discount: true },
    }),
    prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        code: true,
        currency: true,
        sales: {
          where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
          select: { total: true },
        },
        customerOrders: {
          where: { status: 'DELIVERED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
          select: { total: true },
        },
      },
    }),
    prisma.sale.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true, currency: true } },
        cashier: { select: { name: true } },
      },
    }),
    prisma.invoice.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true, currency: true } },
      },
    }),
  ]);

  const customerOrdersTotal = customerOrdersAgg._sum.total || 0;
  const posSalesTotal = posSalesAgg._sum.total || 0;
  const grossOrderValue = customerOrdersTotal + posSalesTotal;
  const totalRefunds = refundSalesAgg._sum.total || 0;
  const totalDiscounts = discountsAgg._sum.discount || 0;

  // Platform standard commission rate is 2.5%
  const commissionRate = 0.025;
  const platformCommissionRevenue = (grossOrderValue - totalRefunds) * commissionRate;
  const netPharmacyPayouts = (grossOrderValue - totalRefunds) - platformCommissionRevenue;

  // Calculate pharmacy settlement table
  const pharmacySettlements = pharmacies.map((pharmacy) => {
    const posSum = pharmacy.sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const orderSum = pharmacy.customerOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const gross = posSum + orderSum;
    const fee = gross * commissionRate;
    const net = gross - fee;

    return {
      id: pharmacy.id,
      name: pharmacy.name,
      code: pharmacy.code,
      currency: pharmacy.currency,
      transactionCount: pharmacy.sales.length + pharmacy.customerOrders.length,
      gross,
      fee,
      net,
    };
  }).sort((a, b) => b.gross - a.gross);

  return (
    <div className="space-y-7">
      <AdminHeader
        title="Finance & Revenue Central"
        description="Authoritative accounting overview of platform GMV, commissions, pharmacy settlements, and transaction audits."
        icon={DollarSign}
        actions={
          <div className="flex items-center gap-2.5">
            <AdminDateFilter selected={range} />
            <a
              href="/api/owner/finance/export"
              download
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs hover:bg-slate-50"
            >
              <Download className="h-4 w-4" /> Export CSV
            </a>
          </div>
        }
      />

      {/* Primary Financial Metric Cards */}
      <section className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Order Value (GMV)</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(grossOrderValue)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {formatCurrency(posSalesTotal)} POS + {formatCurrency(customerOrdersTotal)} Online
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Net Platform Revenue</span>
            <span className="rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(platformCommissionRevenue)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Recognized 2.5% platform fee on settled volume
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated Pharmacy Payouts</span>
            <span className="rounded-xl bg-violet-50 p-2 text-violet-700 ring-1 ring-violet-100">
              <Scale className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(netPharmacyPayouts)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Net disbursement to {pharmacies.length} active pharmacy tenants
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Refunds & Discounts</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700 ring-1 ring-amber-100">
              <Receipt className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(totalRefunds)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Discounts: {formatCurrency(totalDiscounts)} applied at register
          </p>
        </div>
      </section>

      {/* Pharmacy Settlements Breakdown */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Pharmacy Settlement & Reconciliation Ledger</h2>
          <p className="text-[10px] text-slate-500">
            Calculated disbursement schedule and platform commissions per enrolled pharmacy tenant
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Pharmacy Tenant</th>
                <th className="px-5 py-3">Completed Transactions</th>
                <th className="px-5 py-3">Gross Volume</th>
                <th className="px-5 py-3">Platform Fee (2.5%)</th>
                <th className="px-5 py-3">Net Settlement Payable</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pharmacySettlements.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <Link
                      href={`/owner/pharmacies/${p.id}`}
                      className="font-bold text-slate-900 hover:text-emerald-700"
                    >
                      {p.name}
                    </Link>
                    <p className="font-mono text-[10px] text-slate-400">{p.code}</p>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{p.transactionCount} records</td>
                  <td className="px-5 py-3.5 font-bold text-slate-900">{formatCurrency(p.gross, p.currency)}</td>
                  <td className="px-5 py-3.5 font-semibold text-emerald-700">{formatCurrency(p.fee, p.currency)}</td>
                  <td className="px-5 py-3.5 font-extrabold text-slate-900">{formatCurrency(p.net, p.currency)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Link
                      href={`/owner/pharmacies/${p.id}?tab=overview`}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      View Ledger
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent Transaction Activity */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* POS Sales Feed */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-extrabold text-slate-900">Recent POS Sales Transactions</h2>
            <p className="text-[10px] text-slate-500">Live checkout transactions from physical pharmacy branches</p>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentSales.length > 0 ? (
              recentSales.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">
                      {s.organization.name} · <span className="font-mono text-slate-500 font-normal">Sale #{s.saleNumber}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Cashier: {s.cashier.name} · {formatDateTime(s.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{formatCurrency(s.total, s.organization.currency)}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                      {s.paymentMethod}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500">No POS sales records found.</p>
            )}
          </div>
        </section>

        {/* Issued Invoices Feed */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-3.5">
            <h2 className="text-sm font-extrabold text-slate-900">Customer Invoices Issued</h2>
            <p className="text-[10px] text-slate-500">Digital and physical receipts generated</p>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentInvoices.length > 0 ? (
              recentInvoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900 font-mono">Invoice #{inv.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-500">{inv.organization.name} · {formatDateTime(inv.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold text-slate-900">{formatCurrency(inv.amount, inv.organization.currency)}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-700">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-500">No invoices issued yet.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
