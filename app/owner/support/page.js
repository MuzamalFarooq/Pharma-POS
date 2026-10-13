import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, LifeBuoy, MessageSquare, Search, SlidersHorizontal } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminPagination from '@/components/owner/AdminPagination';
import CreateTicketModal from '@/components/owner/CreateTicketModal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Support & Disputes - PharmaPulse Administration' };

const PAGE_SIZE = 20;
const statuses = ['ALL', 'OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE', 'RESOLVED', 'CLOSED'];
const priorities = ['ALL', 'LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default async function SupportPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const statusParam = typeof params?.status === 'string' ? params.status.toUpperCase() : 'ALL';
  const status = statuses.includes(statusParam) ? statusParam : 'ALL';
  const priorityParam = typeof params?.priority === 'string' ? params.priority.toUpperCase() : 'ALL';
  const priority = priorities.includes(priorityParam) ? priorityParam : 'ALL';
  const page = Math.max(1, parseInt(params?.page || '1', 10));

  const whereClause = {
    ...(status !== 'ALL' ? { status } : {}),
    ...(priority !== 'ALL' ? { priority } : {}),
    ...(query
      ? {
          OR: [
            { ticketNumber: { contains: query, mode: 'insensitive' } },
            { subject: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { customerName: { contains: query, mode: 'insensitive' } },
            { customerEmail: { contains: query, mode: 'insensitive' } },
            { pharmacyName: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [totalCount, pharmacies, tickets] = await Promise.all([
    prisma.supportTicket.count({ where: whereClause }),
    prisma.organization.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    prisma.supportTicket.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        _count: { select: { comments: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const priorityColors = {
    LOW: 'bg-slate-100 text-slate-700',
    MEDIUM: 'bg-sky-50 text-sky-700 border border-sky-200',
    HIGH: 'bg-amber-50 text-amber-800 border border-amber-200',
    URGENT: 'bg-rose-50 text-rose-700 border border-rose-200 font-extrabold',
  };

  const statusColors = {
    OPEN: 'bg-amber-50 text-amber-800',
    IN_PROGRESS: 'bg-sky-50 text-sky-700',
    WAITING_RESPONSE: 'bg-violet-50 text-violet-700',
    RESOLVED: 'bg-emerald-50 text-emerald-700',
    CLOSED: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Support & Dispute Resolution"
        description="Investigate pharmacy disputes, customer complaints, refund requests, and technical issues."
        icon={LifeBuoy}
        badge={`${totalCount} Tickets`}
        actions={<CreateTicketModal pharmacies={pharmacies} />}
      />

      {/* Filter and Search Bar */}
      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search tickets</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by ticket #, subject, customer, or pharmacy name..."
            className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Status filter</span>
          <select
            name="status"
            defaultValue={status}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-slate-600">
          <span className="sr-only">Priority filter</span>
          <select
            name="priority"
            defaultValue={priority}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p === 'ALL' ? 'All Priorities' : p}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Filter
        </button>
        {(query || status !== 'ALL' || priority !== 'ALL') && (
          <Link
            href="/owner/support"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Tickets Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Ticket #</th>
                <th className="px-5 py-3.5">Subject & Category</th>
                <th className="px-5 py-3.5">Related Parties</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Created</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {tickets.length > 0 ? (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                      <Link href={`/owner/support/${t.id}`} className="hover:text-emerald-700">
                        {t.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/support/${t.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700 block"
                      >
                        {t.subject}
                      </Link>
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                        {t.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{t.pharmacyName || 'No pharmacy'}</p>
                      <p className="text-[11px] text-slate-500">
                        {t.customerName ? `${t.customerName} (${t.customerEmail || ''})` : t.customerEmail || '—'}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${priorityColors[t.priority] || ''}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${statusColors[t.status] || ''}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {formatDateTime(t.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/owner/support/${t.id}`}
                        className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Inspect <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No support tickets or disputes found matching the filter criteria.
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
