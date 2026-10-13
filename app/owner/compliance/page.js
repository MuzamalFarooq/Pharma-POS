import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  FileCheck,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import ComplianceReviewModal from '@/components/owner/ComplianceReviewModal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Compliance & Verification - PharmaPulse Administration' };

export default async function CompliancePage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';

  const [pharmacies, recentReviews] = await Promise.all([
    prisma.organization.findMany({
      where: {
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { code: { contains: query, mode: 'insensitive' } },
                { licenseNumber: { contains: query, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        complianceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.complianceRecord.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: { select: { name: true, code: true } },
      },
    }),
  ]);

  const verifiedCount = pharmacies.filter((p) => p.complianceRecords[0]?.status === 'VERIFIED').length;
  const missingLicenseCount = pharmacies.filter((p) => !p.licenseNumber).length;
  const pendingReviewCount = pharmacies.filter((p) => !p.complianceRecords[0] || p.complianceRecords[0]?.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Compliance & License Verification"
        description="Verify regulatory pharmacy operating licenses, review jurisdictional compliance documents, and record compliance outcomes."
        icon={FileCheck}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Verified & Compliant</span>
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{verifiedCount} Pharmacies</p>
          <p className="mt-1 text-[11px] text-slate-500">Document review completed & confirmed</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Missing License Reg #</span>
            <span className="rounded-xl bg-rose-50 p-2 text-rose-700 ring-1 ring-rose-100">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-rose-700">{missingLicenseCount} Pharmacies</p>
          <p className="mt-1 text-[11px] text-slate-500">Operating without verified license data</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pending Review</span>
            <span className="rounded-xl bg-amber-50 p-2 text-amber-700 ring-1 ring-amber-100">
              <ShieldAlert className="h-4 w-4" />
            </span>
          </div>
          <p className="mt-3 text-2xl font-extrabold text-slate-900">{pendingReviewCount} Pharmacies</p>
          <p className="mt-1 text-[11px] text-slate-500">Awaiting administrative check</p>
        </div>
      </div>

      {/* Compliance Registry Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Pharmacy Tenant Compliance Registry</h2>
          <p className="text-[10px] text-slate-500">Active status and latest license review record</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3">Pharmacy</th>
                <th className="px-5 py-3">Submitted License #</th>
                <th className="px-5 py-3">Platform Status</th>
                <th className="px-5 py-3">Compliance Status</th>
                <th className="px-5 py-3">Last Reviewed</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pharmacies.map((p) => {
                const latestRecord = p.complianceRecords[0];
                const complianceStatus = latestRecord?.status || 'PENDING_REVIEW';

                return (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/pharmacies/${p.id}`}
                        className="font-bold text-slate-900 hover:text-emerald-700"
                      >
                        {p.name}
                      </Link>
                      <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {p.licenseNumber ? (
                        <span className="font-mono font-bold text-slate-900">{p.licenseNumber}</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Missing</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          complianceStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700'
                            : complianceStatus === 'EXPIRED'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {complianceStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {latestRecord ? (
                        <div>
                          <p>{formatDateTime(latestRecord.reviewedAt)}</p>
                          <p className="text-[10px] text-slate-400">By {latestRecord.reviewedBy}</p>
                        </div>
                      ) : (
                        <span>Not reviewed</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <ComplianceReviewModal organization={p} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
