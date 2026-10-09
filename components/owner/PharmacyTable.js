import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import PharmacyDecisionControls from '@/components/owner/PharmacyDecisionControls';
import PharmacyStatusBadge from '@/components/owner/PharmacyStatusBadge';

export default function PharmacyTable({ pharmacies, emptyMessage }) {
  if (pharmacies.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <p className="text-sm font-bold text-slate-800">No pharmacies found</p>
        <p className="mt-1 text-xs text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px] text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3.5">Pharmacy Name</th>
              <th className="px-4 py-3.5">Owner Name</th>
              <th className="px-4 py-3.5">Email</th>
              <th className="px-4 py-3.5">Phone</th>
              <th className="px-4 py-3.5">Registration Date</th>
              <th className="px-4 py-3.5">Location</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {pharmacies.map((pharmacy) => {
              const owner = pharmacy.members[0]?.user;
              return (
                <tr key={pharmacy.id} className={pharmacy.status === 'PENDING' ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                  <td className="px-4 py-3.5">
                    <Link href={`/owner/pharmacies/${pharmacy.id}`} className="font-bold text-slate-900 hover:text-emerald-700">
                      {pharmacy.name}
                    </Link>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">{pharmacy.code}</p>
                  </td>
                  <td className="px-4 py-3.5 font-semibold">{owner?.name || '—'}</td>
                  <td className="px-4 py-3.5">{owner?.email || pharmacy.email}</td>
                  <td className="px-4 py-3.5">{pharmacy.phone}</td>
                  <td className="px-4 py-3.5 whitespace-nowrap">{formatDate(pharmacy.createdAt)}</td>
                  <td className="px-4 py-3.5">{[pharmacy.city, pharmacy.state, pharmacy.country].filter(Boolean).join(', ')}</td>
                  <td className="px-4 py-3.5"><PharmacyStatusBadge status={pharmacy.status} /></td>
                  <td className="px-4 py-3.5">
                    <div className="flex min-w-48 flex-col items-start gap-2">
                      <Link href={`/owner/pharmacies/${pharmacy.id}`} className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900">
                        View Details <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                      <PharmacyDecisionControls organizationId={pharmacy.id} status={pharmacy.status} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
