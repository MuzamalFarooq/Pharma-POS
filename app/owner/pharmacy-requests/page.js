import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Search } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { redirect } from 'next/navigation';
import PharmacyTable from '@/components/owner/PharmacyTable';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Pharmacy Requests - PharmaPulse' };

export default async function PharmacyRequestsPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const pharmacies = await prisma.organization.findMany({
    where: {
      status: 'PENDING',
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
    orderBy: { createdAt: 'asc' },
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
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <Link href="/owner" className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-emerald-700">
            <ArrowLeft className="h-3.5 w-3.5" /> Platform overview
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold tracking-tight text-slate-900">
            <ClipboardCheck className="h-6 w-6 text-amber-600" /> Pharmacy Requests
          </h1>
          <p className="mt-1 text-xs text-slate-500">Review new pharmacy registrations before enabling dashboard access.</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
          Pending Requests: <span className="text-base font-extrabold">{pharmacies.length}</span>
        </div>
      </div>

      <form method="get" className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search pending requests</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input name="q" defaultValue={query} placeholder="Search pharmacy, email, or city" className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" />
        </label>
        <button type="submit" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50">Search</button>
      </form>

      <PharmacyTable pharmacies={pharmacies} emptyMessage="There are no pharmacy registrations waiting for approval." />
    </div>
  );
}
