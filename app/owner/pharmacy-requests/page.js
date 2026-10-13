import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardCheck, Search } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import PharmacyTable from '@/components/owner/PharmacyTable';
import AdminPagination from '@/components/owner/AdminPagination';
import AdminHeader from '@/components/owner/AdminHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pending Pharmacy Requests - PharmaPulse Administration' };

const PAGE_SIZE = 15;

export default async function PharmacyRequestsPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const page = Math.max(1, parseInt(params?.page || '1', 10));

  const whereClause = {
    status: 'PENDING',
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
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

  const [totalCount, pharmacies] = await Promise.all([
    prisma.organization.count({ where: whereClause }),
    prisma.organization.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        members: {
          where: { role: 'OWNER' },
          orderBy: { createdAt: 'asc' },
          take: 1,
          include: { user: { select: { name: true, email: true } } },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Pending Pharmacy Requests"
        description="Review new pharmacy applications and license credentials before granting platform access."
        icon={ClipboardCheck}
        badge={`${totalCount} Pending`}
        backHref="/owner"
        backLabel="Platform Overview"
      />

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search pending requests</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by pharmacy name, applicant email, city, or license number..."
            className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Search
        </button>
        {query && (
          <Link
            href="/owner/pharmacy-requests"
            className="flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear
          </Link>
        )}
      </form>

      <PharmacyTable
        pharmacies={pharmacies}
        emptyMessage="There are currently no pharmacy applications awaiting approval."
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
