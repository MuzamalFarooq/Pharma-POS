import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  Activity,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck,
  Mail,
  MapPin,
  Pill,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Users,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import PharmacyDecisionControls from '@/components/owner/PharmacyDecisionControls';
import PharmacyStatusBadge from '@/components/owner/PharmacyStatusBadge';

export const dynamic = 'force-dynamic';

export default async function PharmacyDetailsPage({ params, searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { organizationId } = await params;
  const sParams = await searchParams;
  const activeTab = typeof sParams?.tab === 'string' ? sParams.tab : 'overview';

  const pharmacy = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      branches: { orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }] },
      members: {
        orderBy: { createdAt: 'asc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              createdAt: true,
              passwordChangedAt: true,
            },
          },
        },
      },
      _count: {
        select: {
          medicines: true,
          batches: true,
          customerOrders: true,
          sales: true,
          invoices: true,
        },
      },
    },
  });

  if (!pharmacy) notFound();

  // Load contextual tab data
  const [salesAggregate, recentOrders, recentMedicines, auditLogs, complianceRecords] = await Promise.all([
    prisma.sale.aggregate({
      where: { organizationId, status: 'COMPLETED' },
      _sum: { total: true },
    }),
    prisma.customerOrder.findMany({
      where: { organizationId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        branch: { select: { name: true } },
      },
    }),
    prisma.medicine.findMany({
      where: { organizationId },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        batches: { select: { quantity: true, expiryDate: true, status: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { organizationId },
      take: 15,
      orderBy: { timestamp: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.complianceRecord.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  const ownerMember = pharmacy.members.find((m) => m.role === 'OWNER');
  const owner = ownerMember?.user;
  const totalSalesRevenue = salesAggregate._sum.total || 0;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: Building2 },
    { key: 'staff', label: `Staff & Team (${pharmacy.members.length})`, icon: Users },
    { key: 'products', label: `Inventory (${pharmacy._count.medicines})`, icon: Pill },
    { key: 'orders', label: `Orders (${pharmacy._count.customerOrders})`, icon: ShoppingBag },
    { key: 'compliance', label: 'Compliance & License', icon: FileCheck },
    { key: 'activity', label: 'Audit Trail', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Back button & Title banner */}
      <div>
        <Link
          href="/owner/pharmacies"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all pharmacies
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
              <Building2 className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{pharmacy.name}</h1>
                <PharmacyStatusBadge status={pharmacy.status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="font-mono font-bold text-slate-700">Code: {pharmacy.code}</span>
                <span>·</span>
                <span>Created {formatDateTime(pharmacy.createdAt)}</span>
                <span>·</span>
                <span>Plan: <strong className="text-slate-800">{pharmacy.subscriptionPlan}</strong></span>
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <PharmacyDecisionControls organizationId={pharmacy.id} status={pharmacy.status} />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto border-b border-slate-200">
        <div className="flex space-x-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <Link
                key={tab.key}
                href={`/owner/pharmacies/${pharmacy.id}?tab=${tab.key}`}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition ${
                  active
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total POS Revenue</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{formatCurrency(totalSalesRevenue, pharmacy.currency)}</p>
              <p className="mt-1 text-[11px] text-slate-500">{pharmacy._count.sales} completed sales</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Catalog Size</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{pharmacy._count.medicines} Medicines</p>
              <p className="mt-1 text-[11px] text-slate-500">{pharmacy._count.batches} inventory batches</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Orders</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{pharmacy._count.customerOrders}</p>
              <p className="mt-1 text-[11px] text-slate-500">Online fulfillment orders</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Active Branches</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{pharmacy.branches.length}</p>
              <p className="mt-1 text-[11px] text-slate-500">Physical dispensaries</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <Building2 className="h-4 w-4 text-emerald-600" /> Business & Contact Profile
            </h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pharmacy Email</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-900">{pharmacy.email}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Phone</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-900">{pharmacy.phone}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">License Number</dt>
                <dd className="mt-1 font-mono text-xs font-bold text-slate-900">{pharmacy.licenseNumber || 'Not Provided'}</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Location Address</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-900">
                  {[pharmacy.address, pharmacy.city, pharmacy.state, pharmacy.country].filter(Boolean).join(', ')}
                </dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Operating Currency & Tax</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-900">{pharmacy.currency} · Tax {pharmacy.taxRate}%</dd>
              </div>
              <div className="rounded-xl bg-slate-50 p-3.5">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Registered Owner</dt>
                <dd className="mt-1 text-xs font-semibold text-slate-900">{owner?.name || '—'} ({owner?.email || '—'})</dd>
              </div>
            </dl>
          </div>

          {/* Branches Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Physical Branches
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {pharmacy.branches.map((b) => (
                <div key={b.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">{b.name} {b.isMain && <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-700">Main</span>}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{b.status}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500 font-mono">Code: {b.code}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{[b.address, b.city].filter(Boolean).join(', ') || 'No address'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Staff & Team */}
      {activeTab === 'staff' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Assigned Team Members & Staff</h2>
            <p className="text-[10px] text-slate-500">Users who hold roles and access privileges in this pharmacy</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Membership Status</th>
                <th className="px-5 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pharmacy.members.map((member) => (
                <tr key={member.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{member.user.name}</p>
                    <p className="text-[11px] text-slate-500">{member.user.email}</p>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-800">{member.role}</td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${member.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDateTime(member.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Products & Inventory */}
      {activeTab === 'products' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Inventory Catalog Sample</h2>
            <p className="text-[10px] text-slate-500">Recent medicines registered under this pharmacy tenant</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Medicine Name</th>
                <th className="px-5 py-3">Generic Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Batches</th>
                <th className="px-5 py-3">Total Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentMedicines.length > 0 ? (
                recentMedicines.map((med) => {
                  const stockSum = med.batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
                  return (
                    <tr key={med.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5 font-bold text-slate-900">{med.name}</td>
                      <td className="px-5 py-3.5 text-slate-500">{med.genericName || '—'}</td>
                      <td className="px-5 py-3.5">{med.category?.name || 'General'}</td>
                      <td className="px-5 py-3.5 font-mono">{med.batches.length}</td>
                      <td className="px-5 py-3.5 font-bold">{stockSum} units</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-500">No medicines in catalog yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Orders */}
      {activeTab === 'orders' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Recent Customer Orders</h2>
            <p className="text-[10px] text-slate-500">Online orders routed to this pharmacy</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Branch</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.length > 0 ? (
                recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{ord.id.slice(-8)}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{ord.customerName}</p>
                      <p className="text-[10px] text-slate-500">{ord.customerPhone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{ord.branch.name}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">{formatCurrency(ord.total, pharmacy.currency)}</td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">{ord.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">{formatDateTime(ord.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">No orders recorded for this pharmacy.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Compliance */}
      {activeTab === 'compliance' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">License & Verification Status</h2>
            <p className="text-[10px] text-slate-500">Regulatory documentation and review log</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current License Number</p>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900">{pharmacy.licenseNumber || 'Not submitted'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Account Approval Status</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{pharmacy.status}</p>
              {pharmacy.approvedAt && (
                <p className="mt-0.5 text-[11px] text-slate-500">Approved on {formatDateTime(pharmacy.approvedAt)}</p>
              )}
            </div>
          </div>
          {pharmacy.rejectionReason && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-bold text-rose-900">Recorded Rejection Reason</p>
              <p className="mt-1 text-xs text-rose-800">{pharmacy.rejectionReason}</p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Activity */}
      {activeTab === 'activity' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Pharmacy Audit Log Trail</h2>
            <p className="text-[10px] text-slate-500">Activity and status changes recorded for this pharmacy</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Actor</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">{formatDateTime(log.timestamp)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{log.user?.name || log.userId}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-800">{log.action}</td>
                    <td className="px-5 py-3 text-slate-600">{log.entity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-500">No activity logs recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
