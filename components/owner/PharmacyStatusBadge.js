const styles = {
  PENDING: 'border-amber-200 bg-amber-50 text-amber-800',
  ACTIVE: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  REJECTED: 'border-rose-200 bg-rose-50 text-rose-800',
  SUSPENDED: 'border-slate-200 bg-slate-100 text-slate-700',
};

const labels = {
  PENDING: 'Pending',
  ACTIVE: 'Active',
  REJECTED: 'Rejected',
  SUSPENDED: 'Suspended',
};

export default function PharmacyStatusBadge({ status }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status] || styles.SUSPENDED}`}>
      {labels[status] || status}
    </span>
  );
}
