import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import { formatDateTime } from '@/lib/utils';
import { ShieldAlert, User, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Audit Log - PharmaPulse SaaS',
};

export default async function AuditPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const logs = await prisma.auditLog.findMany({
    where: { organizationId },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Audit Compliance & Activity Log</h1>
        <p className="text-xs text-slate-500">Immutable record of security events, stock changes, sales, and user administrative actions</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Action Performed</th>
                <th className="py-3.5 px-4">Target Entity</th>
                <th className="py-3.5 px-4">Audit Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit events logged yet.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{formatDateTime(log.timestamp)}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.user?.name || 'System'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-semibold">{log.entity} ({log.entityId || '-'})</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-xs">{log.metadata || '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
