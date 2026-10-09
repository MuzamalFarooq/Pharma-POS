import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2, Mail, MapPin, Phone, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatDateTime } from '@/lib/utils';
import PharmacyDecisionControls from '@/components/owner/PharmacyDecisionControls';
import PharmacyStatusBadge from '@/components/owner/PharmacyStatusBadge';

export const dynamic = 'force-dynamic';

export default async function PharmacyDetailsPage({ params }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { organizationId } = await params;
  const pharmacy = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      branches: { orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }] },
      members: {
        where: { role: 'OWNER' },
        orderBy: { createdAt: 'asc' },
        take: 1,
        include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
      },
    },
  });

  if (!pharmacy) notFound();
  const owner = pharmacy.members[0]?.user;
  const registrationFields = [
    ['Pharmacy name', pharmacy.name],
    ['Owner name', owner?.name || '—'],
    ['Owner account email', owner?.email || '—'],
    ['Pharmacy email', pharmacy.email],
    ['Phone', pharmacy.phone],
    ['Address', [pharmacy.address, pharmacy.city, pharmacy.state, pharmacy.postalCode, pharmacy.country].filter(Boolean).join(', ')],
    ['License / registration number', pharmacy.licenseNumber || 'Not provided'],
    ['Requested plan', pharmacy.subscriptionPlan],
    ['Registered', formatDateTime(pharmacy.createdAt)],
    ['Approved', pharmacy.approvedAt ? `${formatDateTime(pharmacy.approvedAt)} · ${pharmacy.approvedByUserId || 'Owner'}` : 'Not approved'],
    ['Rejection reason', pharmacy.rejectionReason || '—'],
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/owner/pharmacies" className="mb-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-emerald-700">
          <ArrowLeft className="h-3.5 w-3.5" /> All pharmacies
        </Link>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{pharmacy.name}</h1>
            <p className="mt-1 text-xs text-slate-500">Pharmacy registration details and platform access.</p>
          </div>
          <PharmacyStatusBadge status={pharmacy.status} />
        </div>
      </div>

      {pharmacy.status === 'PENDING' && (
        <section className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-extrabold text-amber-950">Approval required</h2>
            <p className="mt-1 text-xs text-amber-900">The pharmacy owner cannot access pharmacy tools until this request is approved.</p>
          </div>
          <PharmacyDecisionControls organizationId={pharmacy.id} status={pharmacy.status} />
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><Building2 className="h-4 w-4 text-emerald-600" /> Registration information</h2>
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {registrationFields.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3.5">
              <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
              <dd className="mt-1 break-words text-xs font-semibold text-slate-900">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-400" />{pharmacy.email}</span>
          <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" />{pharmacy.phone}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-slate-400" />{pharmacy.city}, {pharmacy.country}</span>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Branches</h2>
        {pharmacy.branches.length ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {pharmacy.branches.map((branch) => (
              <div key={branch.id} className="rounded-xl border border-slate-200 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-900">{branch.name}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold uppercase text-slate-600">{branch.status}</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-500">{branch.code}{branch.city ? ` · ${branch.city}` : ''}</p>
                {branch.address && <p className="mt-1 text-[10px] text-slate-500">{branch.address}</p>}
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-slate-500">No branches were registered.</p>}
      </section>

      {pharmacy.status !== 'PENDING' && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-extrabold text-slate-900">Access management</h2>
          <PharmacyDecisionControls organizationId={pharmacy.id} status={pharmacy.status} />
        </section>
      )}
    </div>
  );
}
