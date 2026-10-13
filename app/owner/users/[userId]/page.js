import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Calendar,
  KeyRound,
  Mail,
  Shield,
  ShoppingBag,
  User as UserIcon,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import UserActionControls from '@/components/owner/UserActionControls';

export const dynamic = 'force-dynamic';

export default async function UserDetailsPage({ params }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          organization: { select: { id: true, name: true, code: true, status: true } },
          branch: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) notFound();

  // Find customer orders associated with this user's customer record or email
  const [customerOrders, auditLogs] = await Promise.all([
    prisma.customerOrder.findMany({
      where: {
        OR: [
          { customerEmail: { equals: user.email, mode: 'insensitive' } },
          { customer: { is: { userId: user.id } } },
        ],
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { timestamp: 'desc' },
      include: {
        organization: { select: { name: true } },
      },
    }),
  ]);

  const isSuspended = user.memberships.length > 0 && user.memberships.every((m) => m.status === 'DISABLED');

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/owner/users"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all users
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-xs">
              <UserIcon className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{user.name}</h1>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                    isSuspended ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                  }`}
                >
                  {isSuspended ? 'Suspended' : 'Active'}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                <span>{user.email}</span> · <span className="font-mono text-slate-400">ID: {user.id}</span>
              </p>
            </div>
          </div>
          <UserActionControls user={user} isSuspended={isSuspended} />
        </div>
      </div>

      {/* Account Info Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Registration Details</h2>
          <p className="mt-2 text-xs font-semibold text-slate-900">
            Registered: {formatDateTime(user.createdAt)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Profile Updated: {formatDateTime(user.updatedAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Credentials</h2>
          <p className="mt-2 text-xs font-semibold text-slate-900">
            Password Version: <span className="font-mono">v{user.passwordVersion}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Last Changed:{' '}
            {user.passwordChangedAt ? formatDateTime(user.passwordChangedAt) : 'Never changed'}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Scope</h2>
          <p className="mt-2 text-xs font-semibold text-slate-900">
            {user.memberships.length > 0 ? `${user.memberships.length} Pharmacy Memberships` : 'Customer Account'}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {customerOrders.length} online orders recorded
          </p>
        </div>
      </div>

      {/* Pharmacy Memberships */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
          <Building2 className="h-4 w-4 text-emerald-600" /> Pharmacy Memberships & Roles
        </h2>
        {user.memberships.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {user.memberships.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/owner/pharmacies/${m.organizationId}`}
                    className="font-bold text-slate-900 hover:text-emerald-700"
                  >
                    {m.organization.name}
                  </Link>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                    {m.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">Status: {m.status}</p>
                {m.branch && <p className="text-[11px] text-slate-400">Branch: {m.branch.name}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">This user is not attached to any pharmacy staff roles (regular customer account).</p>
        )}
      </div>

      {/* Customer Orders History */}
      {customerOrders.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">Customer Order History</h2>
            <p className="text-[10px] text-slate-500">Orders placed by this user across pharmacies</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Order ID</th>
                <th className="px-5 py-3">Pharmacy</th>
                <th className="px-5 py-3">Total Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customerOrders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">{ord.id.slice(-8)}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{ord.organization.name}</td>
                  <td className="px-5 py-3 font-bold text-slate-900">{formatCurrency(ord.total)}</td>
                  <td className="px-5 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                      {ord.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(ord.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Audit History */}
      {auditLogs.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-sm font-extrabold text-slate-900">User Activity History</h2>
            <p className="text-[10px] text-slate-500">Audit events recorded for this user identity</p>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Pharmacy</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(log.timestamp)}</td>
                  <td className="px-5 py-3 text-slate-800">{log.organization.name}</td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">{log.action}</td>
                  <td className="px-5 py-3 text-slate-600">{log.entity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
