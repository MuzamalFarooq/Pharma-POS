import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, Search, Shield, SlidersHorizontal, Users } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminPagination from '@/components/owner/AdminPagination';
import UserActionControls from '@/components/owner/UserActionControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'User Management - PharmaPulse Administration' };

const PAGE_SIZE = 20;
const roles = ['ALL', 'OWNER', 'MANAGER', 'PHARMACIST', 'CASHIER', 'STAFF', 'CUSTOMER'];

export default async function UsersPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const selectedRole = typeof params?.role === 'string' ? params.role.toUpperCase() : 'ALL';
  const role = roles.includes(selectedRole) ? selectedRole : 'ALL';
  const sort = typeof params?.sort === 'string' ? params.sort : 'newest';
  const page = Math.max(1, parseInt(params?.page || '1', 10));

  const whereClause = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { id: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(role !== 'ALL'
      ? role === 'CUSTOMER'
        ? { memberships: { none: {} } }
        : { memberships: { some: { role } } }
      : {}),
  };

  const orderByMap = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'name-asc': { name: 'asc' },
    'name-desc': { name: 'desc' },
  };

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where: whereClause }),
    prisma.user.findMany({
      where: whereClause,
      orderBy: orderByMap[sort] || { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        memberships: {
          include: {
            organization: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: {
            createdPurchases: true,
            processedSales: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="User & Account Management"
        description="Inspect all platform users, manage permissions, suspend accounts, and trigger secure password resets."
        icon={Users}
        badge={`${totalCount} Users`}
      />

      {/* Filter and Search Bar */}
      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search users</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by name, email, or user identifier..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Role filter</span>
          <select
            name="role"
            defaultValue={role}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All Roles' : r.charAt(0) + r.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Sort by</span>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
          >
            <option value="newest">Newest Registered</option>
            <option value="oldest">Oldest Registered</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Filter
        </button>
        {(query || role !== 'ALL' || sort !== 'newest') && (
          <Link
            href="/owner/users"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Users Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role / Affiliations</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5">Registered</th>
                <th className="px-5 py-3.5">Security Info</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.length > 0 ? (
                users.map((u) => {
                  const isSuspended = u.memberships.length > 0 && u.memberships.every((m) => m.status === 'DISABLED');
                  const primaryRole = u.memberships[0]?.role || 'CUSTOMER';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <Link href={`/owner/users/${u.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                          {u.name}
                        </Link>
                        <p className="text-[11px] text-slate-500">{u.email}</p>
                        <p className="mt-0.5 font-mono text-[9px] text-slate-400">ID: {u.id.slice(-8)}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {primaryRole}
                          </span>
                          {u.memberships.map((m) => (
                            <Link
                              key={m.id}
                              href={`/owner/pharmacies/${m.organizationId}`}
                              className="text-[11px] font-medium text-emerald-700 hover:underline"
                            >
                              {m.organization.name}
                            </Link>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isSuspended
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {isSuspended ? 'Suspended' : 'Active'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="px-5 py-3.5 text-[11px] text-slate-500">
                        {u.passwordChangedAt ? (
                          <span>Pass changed {formatDateTime(u.passwordChangedAt)}</span>
                        ) : (
                          <span>Default password</span>
                        )}
                        <p className="font-mono text-[9px] text-slate-400">v{u.passwordVersion}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/owner/users/${u.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                          >
                            Details <ArrowUpRight className="h-3 w-3" />
                          </Link>
                          <UserActionControls user={u} isSuspended={isSuspended} />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No users found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
