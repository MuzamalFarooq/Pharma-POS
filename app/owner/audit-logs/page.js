import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Search, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminPagination from '@/components/owner/AdminPagination';
import AdminDateFilter from '@/components/owner/AdminDateFilter';
import { getDateRangeFilter } from '@/lib/date-utils';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Security & Audit Logs - PharmaPulse Administration' };

const PAGE_SIZE = 25;

export default async function AuditLogsPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const actionFilter = typeof params?.action === 'string' ? params.action.trim() : 'ALL';
  const range = typeof params?.range === 'string' ? params.range : 'all';
  const page = Math.max(1, parseInt(params?.page || '1', 10));
  const dateFilter = getDateRangeFilter(range);

  const whereClause = {
    ...(dateFilter ? { timestamp: dateFilter } : {}),
    ...(actionFilter !== 'ALL' ? { action: actionFilter } : {}),
    ...(query
      ? {
          OR: [
            { actorEmail: { contains: query, mode: 'insensitive' } },
            { actorName: { contains: query, mode: 'insensitive' } },
            { action: { contains: query, mode: 'insensitive' } },
            { entityType: { contains: query, mode: 'insensitive' } },
            { entityId: { contains: query, mode: 'insensitive' } },
            { details: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [totalCount, distinctActions, logs] = await Promise.all([
    prisma.platformAuditLog.count({ where: whereClause }),
    prisma.platformAuditLog.findMany({
      select: { action: true },
      distinct: ['action'],
    }),
    prisma.platformAuditLog.findMany({
      where: whereClause,
      orderBy: { timestamp: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Security & Audit Logs"
        description="Immutable, trusted append-only audit records of all platform owner actions, security events, and configuration modifications."
        icon={ShieldAlert}
        badge={`${totalCount} Events`}
      />

      {/* Date Filter & Search Form */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form method="get" className="flex flex-1 flex-col gap-2.5 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search audit logs</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by actor, action name, entity ID, or details..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="sr-only">Filter by action</span>
            <select
              name="action"
              defaultValue={actionFilter}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Actions</option>
              {distinctActions.map((a) => (
                <option key={a.action} value={a.action}>
                  {a.action}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Search
          </button>
          {(query || actionFilter !== 'ALL') && (
            <Link
              href="/owner/audit-logs"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          )}
        </form>
        <AdminDateFilter selected={range} />
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Actor Identity</th>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Details & Payload</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.length > 0 ? (
                logs.map((log) => {
                  let formattedDetails = null;
                  if (log.details) {
                    try {
                      formattedDetails = JSON.stringify(JSON.parse(log.details), null, 2);
                    } catch {
                      formattedDetails = log.details;
                    }
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{log.actorName || log.actorEmail}</p>
                        <p className="text-[11px] text-slate-500">{log.actorEmail}</p>
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-600">
                          {log.actorType}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-900">{log.entityType}</p>
                        {log.entityId && (
                          <p className="font-mono text-[10px] text-slate-400">ID: {log.entityId.slice(-12)}</p>
                        )}
                        {log.organizationId && (
                          <Link
                            href={`/owner/pharmacies/${log.organizationId}`}
                            className="text-[10px] text-emerald-700 hover:underline"
                          >
                            View Pharmacy
                          </Link>
                        )}
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        {formattedDetails ? (
                          <details className="cursor-pointer text-[11px]">
                            <summary className="font-medium text-slate-600 hover:text-slate-900">
                              View Payload
                            </summary>
                            <pre className="mt-1 max-h-32 overflow-auto rounded-lg bg-slate-950 p-2 font-mono text-[10px] text-slate-200">
                              {formattedDetails}
                            </pre>
                          </details>
                        ) : (
                          <span className="text-slate-400 text-[11px]">None</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    No audit records found matching the specified parameters.
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
