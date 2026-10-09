import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Building2,
  ClipboardCheck,
  DollarSign,
  ShoppingBag,
  Users,
} from 'lucide-react';
import prisma from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import PharmacyStatusBadge from '@/components/owner/PharmacyStatusBadge';

export const metadata = { title: 'Platform Overview - PharmaPulse' };

const ownerActions = [
  'PLATFORM_PHARMACY_APPROVED',
  'PLATFORM_PHARMACY_REJECTED',
  'PLATFORM_PHARMACY_SUSPENDED',
  'PLATFORM_PHARMACY_REACTIVATED',
];

const formatMetric = (value) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);

export default async function OwnerDashboardPage() {
  const [
    totalPharmacies,
    pendingRequests,
    activePharmacies,
    rejectedPharmacies,
    suspendedPharmacies,
    activeMemberships,
    totalCustomers,
    totalOrders,
    salesAggregate,
    recentPharmacies,
    recentOrders,
    recentActivity,
  ] = await Promise.all([
    prisma.organization.count(),
    prisma.organization.count({ where: { status: 'PENDING' } }),
    prisma.organization.count({ where: { status: 'ACTIVE' } }),
    prisma.organization.count({ where: { status: 'REJECTED' } }),
    prisma.organization.count({ where: { status: 'SUSPENDED' } }),
    prisma.organizationMember.groupBy({
      by: ['userId'],
      where: { status: 'ACTIVE', organization: { status: 'ACTIVE' } },
    }),
    prisma.customer.count(),
    prisma.customerOrder.count(),
    prisma.sale.aggregate({ where: { status: 'COMPLETED' }, _sum: { total: true } }),
    prisma.organization.findMany({
      take: 6,
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
    prisma.auditLog.findMany({
      where: { action: { in: ownerActions } },
      take: 8,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true } },
        organization: { select: { name: true } },
      },
    }),
  ]);

  const cards = [
    { label: 'Registered Pharmacies', value: totalPharmacies, detail: 'All platform organizations', href: '/owner/pharmacies', icon: Building2, color: 'text-sky-700 bg-sky-50' },
    { label: 'Pending Requests', value: pendingRequests, detail: 'Waiting for owner approval', href: '/owner/pharmacy-requests', icon: ClipboardCheck, color: 'text-amber-700 bg-amber-50', pending: true },
    { label: 'Active Pharmacies', value: activePharmacies, detail: 'Approved and enabled', href: '/owner/pharmacies?status=ACTIVE', icon: Building2, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Rejected Pharmacies', value: rejectedPharmacies, detail: 'Requests declined by the platform owner', href: '/owner/pharmacies?status=REJECTED', icon: Activity, color: 'text-rose-700 bg-rose-50' },
    { label: 'Suspended Pharmacies', value: suspendedPharmacies, detail: 'Approved pharmacies with access paused', href: '/owner/pharmacies?status=SUSPENDED', icon: Building2, color: 'text-slate-700 bg-slate-100' },
    { label: 'Active Users', value: activeMemberships.length, detail: 'Unique users with active pharmacy access', icon: Users, color: 'text-violet-700 bg-violet-50' },
    { label: 'Total Customers', value: totalCustomers, detail: 'Customer records across pharmacies', icon: Users, color: 'text-indigo-700 bg-indigo-50' },
    { label: 'Total Orders', value: totalOrders, detail: 'Online customer orders', icon: ShoppingBag, color: 'text-teal-700 bg-teal-50' },
    { label: 'Revenue', value: formatMetric(salesAggregate._sum.total || 0), detail: 'Completed sales; original currencies are unconverted', icon: DollarSign, color: 'text-emerald-700 bg-emerald-50' },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Platform Overview</h1>
          <p className="mt-1 text-xs text-slate-500">Monitor pharmacy registrations and platform activity.</p>
        </div>
        <Link href="/owner/pharmacy-requests" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700">
          Review pharmacy requests <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform metrics">
        {cards.map(({ label, value, detail, href, icon: Icon, color, pending }) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <span className={`rounded-xl p-2 ${color}`}><Icon className="h-4 w-4" /></span>
              </div>
              <p className={`mt-3 text-2xl font-extrabold ${pending && pendingRequests > 0 ? 'text-amber-800' : 'text-slate-900'}`}>{value}</p>
              <p className="mt-1 text-[10px] text-slate-500">{detail}</p>
            </>
          );
          const cardClass = `rounded-2xl border p-4 shadow-sm ${href ? 'transition hover:-translate-y-0.5 hover:shadow-md' : ''} ${pending && pendingRequests > 0 ? 'border-amber-300 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white'}`;

          return href
            ? <Link key={label} href={href} className={cardClass}>{content}</Link>
            : <div key={label} className={cardClass}>{content}</div>;
        })}
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Recent Pharmacy Registrations</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">Newest pharmacy applications</p>
            </div>
            <Link href="/owner/pharmacies" className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentPharmacies.length ? recentPharmacies.map((pharmacy) => (
              <Link key={pharmacy.id} href={`/owner/pharmacies/${pharmacy.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-slate-50">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">{pharmacy.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{pharmacy.members[0]?.user.name || pharmacy.email} · {formatDateTime(pharmacy.createdAt)}</p>
                </div>
                <PharmacyStatusBadge status={pharmacy.status} />
              </Link>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">No pharmacy registrations yet.</p>}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Recent Orders</h2>
              <p className="mt-0.5 text-[10px] text-slate-500">Online customer orders across pharmacies</p>
            </div>
            <ShoppingBag className="h-4 w-4 text-slate-400" />
          </div>
          <div className="divide-y divide-slate-100">
            {recentOrders.length ? recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-slate-800">{order.customerName} · {order.organization.name}</p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">{order.branch.name} · {formatDateTime(order.createdAt)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">{order.status}</span>
              </div>
            )) : <p className="px-5 py-10 text-center text-xs text-slate-500">No customer orders yet.</p>}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Recent Owner Activity</h2>
          <p className="mt-0.5 text-[10px] text-slate-500">Pharmacy approval and status changes recorded in the audit log</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-155 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr><th className="px-5 py-3">Timestamp</th><th className="px-5 py-3">Platform Owner</th><th className="px-5 py-3">Action</th><th className="px-5 py-3">Pharmacy</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentActivity.length ? recentActivity.map((item) => (
                <tr key={item.id}>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{formatDateTime(item.timestamp)}</td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{item.user.name}</td>
                  <td className="px-5 py-3 font-bold text-slate-700">{item.action.replace('PLATFORM_PHARMACY_', '').toLowerCase()}</td>
                  <td className="px-5 py-3 text-slate-600">{item.organization.name}</td>
                </tr>
              )) : <tr><td colSpan={4} className="px-5 py-10 text-center text-slate-500">No owner actions have been recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
