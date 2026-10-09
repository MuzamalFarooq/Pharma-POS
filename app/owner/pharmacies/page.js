import { redirect } from 'next/navigation';
import { Search, Building2 } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import PharmacyTable from '@/components/owner/PharmacyTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pharmacies - PharmaPulse' };

const statuses = ['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'];

export default async function PharmaciesPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const requestedStatus = typeof params?.status === 'string' ? params.status.toUpperCase() : 'ALL';
  const status = statuses.includes(requestedStatus) ? requestedStatus : 'ALL';
  const pharmacies = await prisma.organization.findMany({
    where: {
      ...(status !== 'ALL' ? { status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } },
              { city: { contains: query, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      members: {
        where: { role: 'OWNER' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
          <Building2 className="h-6 w-6 text-emerald-600" /> Pharmacies
        </h1>
        <p className="mt-1 text-xs text-slate-500">Manage platform pharmacy access and review registration details.</p>
      </div>

      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search pharmacies</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input name="q" defaultValue={query} placeholder="Search pharmacy, email, or city" className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Filter by status</span>
          <select name="status" defaultValue={status} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 sm:w-44">
            {statuses.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'All statuses' : item.charAt(0) + item.slice(1).toLowerCase()}</option>)}
          </select>
        </label>
        <button type="submit" className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800">Apply filters</button>
      </form>

      <PharmacyTable pharmacies={pharmacies} emptyMessage="Try another search or status filter." />
      {pharmacies.length === 200 && <p className="text-center text-[11px] text-slate-500">Showing the latest 200 matching pharmacies.</p>}
    </div>
  );
}
