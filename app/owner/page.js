import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  DollarSign,
  FileCheck,
  LifeBuoy,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
  Users,
  XCircle,
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { getDateRangeFilter, getPastDate, buildTimeSeriesSlots } from '@/lib/date-utils';
import PharmacyStatusBadge from '@/components/owner/PharmacyStatusBadge';
import AdminDateFilter from '@/components/owner/AdminDateFilter';
import OwnerOverviewCharts from '@/components/owner/OwnerOverviewCharts';

export const metadata = { title: 'Platform Overview - PharmaPulse Administration' };

export default async function OwnerDashboardPage({ searchParams }) {
  const params = await searchParams;
  const range = typeof params?.range === 'string' ? params.range : '30d';
  const dateFilter = getDateRangeFilter(range);

  // Parallel database aggregation
  const [
    totalPharmacies,
    pendingRequests,
    activePharmacies,
    rejectedPharmacies,
    suspendedPharmacies,
    ownersCount,
    staffCount,
    totalCustomers,
    totalOrders,
    completedOrders,
    pendingOrders,
    cancelledOrders,
    deliveredOrders,
    customerOrdersGmv,
    completedSalesGmv,
    refundSalesSum,
    recentPharmacies,
    recentOrders,
    recentPlatformLogs,
    unresolvedTickets,
    expiringLicensesCount,
    rawHistoryPharmacies,
    rawHistoryOrders,
    rawHistorySales,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: 'PENDING' } }),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({ where: { status: 'REJECTED' } }),
    prisma.organization.count({ where: { status: 'SUSPENDED' } }),
    prisma.organizationMember.count({ where: { role: 'OWNER', status: 'ACTIVE' } }),
    prisma.organizationMember.count({ where: { role: { not: 'OWNER' }, status: 'ACTIVE' } }),
    prisma.customer.count(),
    prisma.customerOrder.count({ where: dateFilter ? { createdAt: dateFilter } : {} }),
    prisma.customerOrder.count({ where: { status: 'DELIVERED', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.customerOrder.count({ where: { status: 'PENDING', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.customerOrder.count({ where: { status: 'CANCELLED', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.customerOrder.count({ where: { status: 'DELIVERED', ...(dateFilter ? { createdAt: dateFilter } : {}) } }),
    prisma.customerOrder.aggregate({
      where: { status: { not: 'CANCELLED' }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { status: 'COMPLETED', ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
    }),
    prisma.sale.aggregate({
      where: { status: { in: ['REFUNDED', 'PARTIALLY_REFUNDED'] }, ...(dateFilter ? { createdAt: dateFilter } : {}) },
      _sum: { total: true },
    }),
    prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          where: { role: 'OWNER' },
          take: 1,
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    prisma.customerOrder.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true } },
        branch: { select: { name: true } },
      },
    }),
    prisma.platformAuditLog.findMany({
      take: 6,
      orderBy: { timestamp: 'desc' },
    }),
    prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE'] } } }),
    prisma.complianceRecord.count({ where: { status: 'PENDING_REVIEW' } }),
    // Historical trends (last 14 days)
    prisma.organization.findMany({
      where: { createdAt: { gte: getPastDate(14) } },
      select: { createdAt: true },
    }),
    prisma.customerOrder.findMany({
      where: { createdAt: { gte: getPastDate(14) } },
      select: { createdAt: true, total: true },
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: getPastDate(14) }, status: 'COMPLETED' },
      select: { createdAt: true, total: true },
    }),
  ]);

  const grossOrderValue = (customerOrdersGmv._sum.total || 0) + (completedSalesGmv._sum.total || 0);
  const refundTotal = refundSalesSum._sum.total || 0;
  // Estimate 2.5% platform fee where supported
  const estimatedPlatformCommission = grossOrderValue * 0.025;

  // Build daily time-series data for the last 14 days
  const timeSeriesMap = buildTimeSeriesSlots(14);

  rawHistoryPharmacies.forEach((p) => {
    const key = p.createdAt.toISOString().split('T')[0];
    if (timeSeriesMap.has(key)) timeSeriesMap.get(key).pharmacies += 1;
  });

  rawHistoryOrders.forEach((o) => {
    const key = o.createdAt.toISOString().split('T')[0];
    if (timeSeriesMap.has(key)) {
      const entry = timeSeriesMap.get(key);
      entry.orders += 1;
      entry.sales += Number(o.total || 0);
    }
  });

  rawHistorySales.forEach((s) => {
    const key = s.createdAt.toISOString().split('T')[0];
    if (timeSeriesMap.has(key)) {
      const entry = timeSeriesMap.get(key);
      entry.sales += Number(s.total || 0);
    }
  });

  const timeSeriesData = Array.from(timeSeriesMap.values());

  return (
    <div className="space-y-7">
      {/* Page Header with Date Filter */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Platform Overview</h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time platform metrics, multi-tenant revenue, and operational status across all pharmacies.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <AdminDateFilter selected={range} />
          {pendingRequests > 0 && (
            <Link
              href="/owner/pharmacy-requests"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{pendingRequests} Pending Approvals</span>
            </Link>
          )}
        </div>
      </div>

      {/* Operational Attention Banner (if items require review) */}
      {(pendingRequests > 0 || unresolvedTickets > 0 || expiringLicensesCount > 0) && (
        <section
          aria-label="Pending operational items"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">Administrative Attention Needed</p>
              <p className="text-[11px] text-amber-800">
                {[
                  pendingRequests > 0 ? `${pendingRequests} pending pharmacy applications` : null,
                  unresolvedTickets > 0 ? `${unresolvedTickets} unresolved support tickets` : null,
                  expiringLicensesCount > 0 ? `${expiringLicensesCount} compliance items to review` : null,
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingRequests > 0 && (
              <Link
                href="/owner/pharmacy-requests"
                className="rounded-lg bg-amber-800 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-amber-900"
              >
                Review Applications
              </Link>
            )}
            {unresolvedTickets > 0 && (
              <Link
                href="/owner/support"
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-50"
              >
                Open Tickets
              </Link>
            )}
          </div>
        </section>
      )}

      {/* Primary KPI Metrics */}
      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Key Performance Indicators">
        <Link
          href="/owner/pharmacies"
          className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Pharmacies</span>
            <span className="rounded-xl bg-sky-50 p-2 text-sky-700 ring-1 ring-sky-100">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{totalPharmacies}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {activePharmacies} active · {suspendedPharmacies} suspended · {rejectedPharmacies} rejected
          </p>
        </Link>

        <Link
          href="/owner/orders"
          className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Orders in Window</span>
            <span className="rounded-xl bg-teal-50 p-2 text-teal-700 ring-1 ring-teal-100">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{totalOrders}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {deliveredOrders} delivered · {pendingOrders} pending · {cancelledOrders} cancelled
          </p>
        </Link>

        <Link
          href="/owner/finance"
          className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Gross Order Value</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatCurrency(grossOrderValue)}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Online orders + POS sales · {formatCurrency(refundTotal)} refunded
          </p>
        </Link>

        <Link
          href="/owner/users"
          className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform Accounts</span>
            <span className="rounded-xl bg-violet-50 p-2 text-violet-700 ring-1 ring-violet-100">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{ownersCount + staffCount + totalCustomers}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {ownersCount} owners · {staffCount} staff · {totalCustomers} customers
          </p>
        </Link>
      </section>

      {/* Interactive Recharts */}
      <OwnerOverviewCharts timeSeriesData={timeSeriesData} />

      {/* Operational Breakdowns Grid */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Order Lifecycle Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">Order Lifecycle Breakdown</h2>
            <p className="text-[10px] text-slate-500">Distribution of customer orders</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Delivered / Completed
              </span>
              <span className="font-bold text-slate-900">{deliveredOrders}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <ClipboardCheck className="h-4 w-4 text-amber-600" /> Pending Confirmation
              </span>
              <span className="font-bold text-slate-900">{pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <XCircle className="h-4 w-4 text-rose-600" /> Cancelled
              </span>
              <span className="font-bold text-slate-900">{cancelledOrders}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
              <span className="font-semibold text-slate-700">Estimated 2.5% Platform Fee</span>
              <span className="font-extrabold text-emerald-700">{formatCurrency(estimatedPlatformCommission)}</span>
            </div>
          </div>
        </section>

        {/* Pharmacy Status Breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">Pharmacy Status Summary</h2>
            <p className="text-[10px] text-slate-500">Tenant onboarding and status health</p>
          </div>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Active Pharmacies
              </span>
              <span className="font-bold text-slate-900">{activePharmacies}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Pending Applications
              </span>
              <span className="font-bold text-amber-800">{pendingRequests}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /> Suspended Access
              </span>
              <span className="font-bold text-slate-900">{suspendedPharmacies}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-medium text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500" /> Rejected Registrations
              </span>
              <span className="font-bold text-slate-900">{rejectedPharmacies}</span>
            </div>
          </div>
        </section>

        {/* Quick Operations Links */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-extrabold text-slate-900">Direct Actions</h2>
            <p className="text-[10px] text-slate-500">Quick links to administrative controls</p>
          </div>
          <div className="mt-4 space-y-2 text-xs">
            <Link
              href="/owner/pharmacy-requests"
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <span>Review Pending Requests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/owner/orders"
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <span>Inspect All Orders</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/owner/audit-logs"
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <span>View Audit Trail</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/owner/health"
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <span>Check System Health</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid gap-5 xl:grid-cols-2">
        {/* Recent Registrations */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Recent Pharmacy Registrations</h2>
              <p className="text-[10px] text-slate-500">Latest pharmacies onboarding to PharmaPulse</p>
            </div>
            <Link href="/owner/pharmacies" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPharmacies.length > 0 ? (
              recentPharmacies.map((pharmacy) => (
                <Link
                  key={pharmacy.id}
                  href={`/owner/pharmacies/${pharmacy.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{pharmacy.name}</p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {pharmacy.members[0]?.user.name || pharmacy.email} · {formatDateTime(pharmacy.createdAt)}
                    </p>
                  </div>
                  <PharmacyStatusBadge status={pharmacy.status} />
                </Link>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-500">No pharmacy registrations recorded.</p>
            )}
          </div>
        </section>

        {/* Recent Platform Orders */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Recent Platform Orders</h2>
              <p className="text-[10px] text-slate-500">Online orders placed across all active pharmacies</p>
            </div>
            <Link href="/owner/orders" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">
                      {order.customerName} · <span className="font-normal text-slate-600">{order.organization.name}</span>
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-500">
                      {order.branch.name} · {formatDateTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {order.status}
                    </span>
                    <p className="mt-0.5 text-xs font-extrabold text-slate-900">{formatCurrency(order.total)}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="px-5 py-8 text-center text-xs text-slate-500">No recent orders found.</p>
            )}
          </div>
        </section>
      </div>

      {/* Recent Security & Audit Logs */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Recent Platform Administrator Activity</h2>
            <p className="text-[10px] text-slate-500">Immutable audit log of platform owner operations</p>
          </div>
          <Link href="/owner/audit-logs" className="text-xs font-bold text-emerald-700 hover:text-emerald-800">
            Full Audit Trail
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Administrator</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentPlatformLogs.length > 0 ? (
                recentPlatformLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(log.timestamp)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{log.actorEmail}</td>
                    <td className="px-5 py-3 font-mono text-[11px] font-bold text-emerald-700">{log.action}</td>
                    <td className="px-5 py-3 text-slate-600">{log.entityType}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                    No administrator actions logged yet.
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
