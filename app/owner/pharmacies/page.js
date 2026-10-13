import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, Search, SlidersHorizontal } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import PharmacyTable from '@/components/owner/PharmacyTable';
import AdminPagination from '@/components/owner/AdminPagination';
import AdminHeader from '@/components/owner/AdminHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pharmacies - PharmaPulse Administration' };

const statuses = ['ALL', 'ACTIVE', 'PENDING', 'SUSPENDED', 'REJECTED'];
const PAGE_SIZE = 15;

export default async function PharmaciesPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const requestedStatus = typeof params?.status === 'string' ? params.status.toUpperCase() : 'ALL';
  const status = statuses.includes(requestedStatus) ? requestedStatus : 'ALL';
  const sort = typeof params?.sort === 'string' ? params.sort : 'newest';
  const page = Math.max(1, parseInt(params?.page || '1', 10));

  const whereClause = {
    ...(status !== 'ALL' ? { status } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { code: { contains: query, mode: 'insensitive' } },
            { licenseNumber: { contains: query, mode: 'insensitive' } },
            {
              members: {
                some: {
                  role: 'OWNER',
                  user: {
                    OR: [
                      { name: { contains: query, mode: 'insensitive' } },
                      { email: { contains: query, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          ],
        }
      : {}),
  };

  const orderByMap = {
    newest: { createdAt: 'desc' },
    oldest: { createdAt: 'asc' },
    'name-asc': { name: 'asc' },
    'name-desc': { name: 'desc' },
  };

  const [totalCount, statusCounts, pharmacies] = await Promise.all([
    prisma.organization.count({ where: whereClause }),
    Promise.all([
      prisma.organization.count(),
      prisma.organization.count({ where: { status: 'ACTIVE' } }),
      prisma.organization.count({ where: { status: 'PENDING' } }),
      prisma.organization.count({ where: { status: 'SUSPENDED' } }),
      prisma.organization.count({ where: { status: 'REJECTED' } }),
    ]),
    prisma.organization.findMany({
      where: whereClause,
      orderBy: orderByMap[sort] || { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        members: {
          where: { role: 'OWNER' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { user: { select: { name: true, email: true } } },
        },
        _count: {
          select: {
            branches: true,
            medicines: true,
            customerOrders: true,
            sales: true,
          },
        },
      },
    }),
  ]);

  const [allCount, activeCount, pendingCount, suspendedCount, rejectedCount] = statusCounts;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Pharmacy Management"
        description="Monitor, approve, suspend, and inspect all pharmacy tenants across PharmaPulse."
        icon={Building2}
        badge={`${totalCount} Total`}
        actions={
          pendingCount > 0 && (
            <Link
              href="/owner/pharmacy-requests"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 shadow-xs hover:bg-amber-400"
            >
              Review {pendingCount} Pending
            </Link>
          )
        }
      />

      {/* Status Filter Badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'All Pharmacies', count: allCount },
          { key: 'ACTIVE', label: 'Active', count: activeCount },
          { key: 'PENDING', label: 'Pending', count: pendingCount },
          { key: 'SUSPENDED', label: 'Suspended', count: suspendedCount },
          { key: 'REJECTED', label: 'Rejected', count: rejectedCount },
        ].map((item) => {
          const isActive = status === item.key;
          return (
            <Link
              key={item.key}
              href={`/owner/pharmacies?status=${item.key}${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] ${
                  isActive ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {item.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search pharmacies</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by pharmacy name, owner, email, city, or license number..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <input type="hidden" name="status" value={status} />
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <SlidersHorizontal className="h-4 w-4 text-slate-400" />
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
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
        {(query || status !== 'ALL' || sort !== 'newest') && (
          <Link
            href="/owner/pharmacies"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </Link>
        )}
      </form>

      <PharmacyTable
        pharmacies={pharmacies}
        emptyMessage="No pharmacies match the specified search or filter criteria."
      />

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
