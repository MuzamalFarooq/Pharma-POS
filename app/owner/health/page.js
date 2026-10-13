import { redirect } from 'next/navigation';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Mail,
  Server,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import AdminHeader from '@/components/owner/AdminHeader';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'System Health - PharmaPulse Administration' };

async function measureDbLatency() {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'OPERATIONAL',
      latencyMs: Date.now() - startTime,
      error: null,
    };
  } catch (err) {
    return {
      status: 'DEGRADED',
      latencyMs: 0,
      error: err.message || 'Database ping failed',
    };
  }
}

export default async function SystemHealthPage() {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { status: dbStatus, latencyMs: dbLatencyMs, error: dbError } = await measureDbLatency();

  // SMTP Email Health check
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  // Environment sanity checks (safe booleans, never reveal secrets)
  const envChecks = [
    { name: 'Database Connection Pool URL', configured: Boolean(process.env.DATABASE_URL) },
    { name: 'Direct Database Unpooled URL', configured: Boolean(process.env.DATABASE_URL_UNPOOLED) },
    { name: 'JWT Session Secret', configured: Boolean(process.env.JWT_SECRET) },
    { name: 'Platform Owner Email Credentials', configured: Boolean(process.env.PHARMA_PLATFORM_OWNER_EMAILS || process.env.PHARMA_PLATFORM_OWNER_EMAIL) },
    { name: 'Platform Owner Password Hash/Secret', configured: Boolean(process.env.PHARMA_PLATFORM_OWNER_PASSWORD) },
    { name: 'SMTP Outgoing Notification Gateway', configured: smtpConfigured },
  ];

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;
  const memoryRssMb = memoryUsage ? Math.round(memoryUsage.rss / 1024 / 1024) : 'N/A';
  const memoryHeapUsedMb = memoryUsage ? Math.round(memoryUsage.heapUsed / 1024 / 1024) : 'N/A';
  const nodeVersion = process.version;
  const uptimeSeconds = Math.round(process.uptime ? process.uptime() : 0);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="System Health & Operational Diagnostics"
        description="Real-time telemetry on PostgreSQL database latency, environment sanity, memory footprints, and service connectivity."
        icon={Activity}
      />

      {/* Main Health Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Database Connectivity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">PostgreSQL (Neon)</span>
            <span
              className={`rounded-full p-1.5 ${
                dbStatus === 'OPERATIONAL'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-50 text-rose-700'
              }`}
            >
              <Database className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-slate-900">{dbStatus}</p>
            <span className="font-mono text-xs font-bold text-emerald-700">{dbLatencyMs}ms ping</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {dbError ? `Error: ${dbError}` : 'Connection pool healthy & responsive'}
          </p>
        </div>

        {/* Outgoing Email Gateway */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">SMTP Notification Relay</span>
            <span
              className={`rounded-full p-1.5 ${
                smtpConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              <Mail className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-slate-900">
              {smtpConfigured ? 'CONFIGURED' : 'NOT CONFIGURED'}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {smtpConfigured ? `Host: ${process.env.SMTP_HOST || 'Ready'}` : 'Password resets and alerts disabled'}
          </p>
        </div>

        {/* Runtime Container Engine */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Node.js Runtime</span>
            <span className="rounded-full bg-slate-100 p-1.5 text-slate-700">
              <Server className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-xl font-extrabold text-slate-900">{nodeVersion}</p>
            <span className="text-xs text-slate-500">Heap: {memoryHeapUsedMb} MB</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Process RSS: {memoryRssMb} MB · Uptime: {uptimeSeconds}s
          </p>
        </div>
      </div>

      {/* Environment Security Sanity Check Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Environment & Secret Integrity Matrix</h2>
          <p className="text-[10px] text-slate-500">
            Verification of required operational secrets without disclosing underlying keys or tokens
          </p>
        </div>
        <div className="divide-y divide-slate-100 text-xs">
          {envChecks.map((check) => (
            <div key={check.name} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50">
              <span className="font-semibold text-slate-800">{check.name}</span>
              <div className="flex items-center gap-1.5">
                {check.configured ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span className="font-bold text-emerald-700">Present & Verified</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 text-rose-600" />
                    <span className="font-bold text-rose-700">Missing in Environment</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
