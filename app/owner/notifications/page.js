import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  LifeBuoy,
  Pill,
  ShieldAlert,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Notifications Center - PharmaPulse Administration' };

export default async function NotificationsPage() {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const [pendingPharmacies, openTickets, expiredBatches, recentSecurityLogs] = await Promise.all([
    prisma.organization.findMany({
      where: { status: 'PENDING' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.supportTicket.findMany({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_RESPONSE'] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: { id: true, ticketNumber: true, subject: true, priority: true, createdAt: true },
    }),
    prisma.medicineBatch.findMany({
      where: {
        expiryDate: { lte: new Date() },
        quantity: { gt: 0 },
      },
      take: 10,
      include: {
        medicine: { select: { name: true } },
        organization: { select: { id: true, name: true } },
      },
    }),
    prisma.platformAuditLog.findMany({
      where: { action: { in: ['USER_SUSPENDED', 'PLATFORM_PHARMACY_REJECTED', 'PLATFORM_PHARMACY_SUSPENDED'] } },
      take: 8,
      orderBy: { timestamp: 'desc' },
    }),
  ]);

  const totalNotifications =
    pendingPharmacies.length + openTickets.length + expiredBatches.length + recentSecurityLogs.length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Platform Notifications Center"
        description="Operational alerts, pending approvals, critical inventory warnings, and security events."
        icon={Bell}
        badge={`${totalNotifications} Active Alerts`}
      />

      <div className="space-y-6">
        {/* Pending Pharmacy Applications */}
        <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-amber-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Pending Pharmacy Approvals ({pendingPharmacies.length})
              </h2>
            </div>
            <Link
              href="/owner/pharmacy-requests"
              className="text-xs font-bold text-amber-900 hover:underline"
            >
              Review All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingPharmacies.length > 0 ? (
              pendingPharmacies.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <Link
                      href={`/owner/pharmacies/${p.id}`}
                      className="font-bold text-slate-900 text-xs hover:text-emerald-700"
                    >
                      {p.name}
                    </Link>
                    <p className="text-[11px] text-slate-500">
                      Applicant: {p.email} · Submitted {formatDateTime(p.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/owner/pharmacies/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 hover:text-amber-950"
                  >
                    Take Action <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))
            ) : (
              <p className="p-5 text-center text-xs text-slate-500">No pharmacy applications awaiting approval.</p>
            )}
          </div>
        </section>

        {/* Unresolved Support Disputes */}
        <section className="overflow-hidden rounded-2xl border border-sky-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-sky-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-sky-950">
                Open Support Tickets & Disputes ({openTickets.length})
              </h2>
            </div>
            <Link href="/owner/support" className="text-xs font-bold text-sky-900 hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {openTickets.length > 0 ? (
              openTickets.map((t) => (
                <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <Link
                      href={`/owner/support/${t.id}`}
                      className="font-bold text-slate-900 text-xs hover:text-emerald-700"
                    >
                      #{t.ticketNumber} · {t.subject}
                    </Link>
                    <p className="text-[11px] text-slate-500">Opened {formatDateTime(t.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                      {t.priority}
                    </span>
                    <Link
                      href={`/owner/support/${t.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-sky-800 hover:text-sky-950"
                    >
                      Resolve <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-5 text-center text-xs text-slate-500">All support tickets are currently resolved.</p>
            )}
          </div>
        </section>

        {/* Expired Inventory Warnings */}
        <section className="overflow-hidden rounded-2xl border border-rose-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50/50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-950">
                Expired Medicine Stock in Circulation ({expiredBatches.length})
              </h2>
            </div>
            <Link href="/owner/products" className="text-xs font-bold text-rose-900 hover:underline">
              Inspect Catalog
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {expiredBatches.length > 0 ? (
              expiredBatches.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{b.medicine.name} (Batch #{b.batchNumber})</p>
                    <p className="text-[11px] text-slate-500">
                      Pharmacy: {b.organization.name} · Expired on {formatDateTime(b.expiryDate)}
                    </p>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800">
                    {b.quantity} expired units
                  </span>
                </div>
              ))
            ) : (
              <p className="p-5 text-center text-xs text-slate-500">No active batches have expired.</p>
            )}
          </div>
        </section>

        {/* Recent Security Interventions */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Security Interventions & Enforcement Events
              </h2>
            </div>
            <Link href="/owner/audit-logs" className="text-xs font-bold text-slate-700 hover:underline">
              Audit Trail
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {recentSecurityLogs.length > 0 ? (
              recentSecurityLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 hover:bg-slate-50">
                  <div>
                    <p className="font-bold text-slate-900">{log.action}</p>
                    <p className="text-[11px] text-slate-500">By {log.actorEmail} · {formatDateTime(log.timestamp)}</p>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                    {log.entityType}
                  </span>
                </div>
              ))
            ) : (
              <p className="p-5 text-center text-xs text-slate-500">No security intervention events recorded.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
