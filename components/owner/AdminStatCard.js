import Link from 'next/link';

export default function AdminStatCard({
  label,
  value,
  detail = null,
  icon: Icon = null,
  href = null,
  colorScheme = 'emerald', // emerald, sky, amber, rose, violet, indigo, slate
  trend = null,
  highlight = false,
}) {
  const schemeClasses = {
    emerald: 'text-emerald-700 bg-emerald-50 ring-emerald-100',
    sky: 'text-sky-700 bg-sky-50 ring-sky-100',
    amber: 'text-amber-800 bg-amber-50 ring-amber-200',
    rose: 'text-rose-700 bg-rose-50 ring-rose-100',
    violet: 'text-violet-700 bg-violet-50 ring-violet-100',
    indigo: 'text-indigo-700 bg-indigo-50 ring-indigo-100',
    slate: 'text-slate-700 bg-slate-100 ring-slate-200',
  };

  const badgeClass = schemeClasses[colorScheme] || schemeClasses.slate;

  const content = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
        {Icon && (
          <span className={`rounded-xl p-2 ring-1 ${badgeClass}`}>
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        {trend && (
          <span
            className={`text-[10px] font-bold ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      {detail && <p className="mt-1 text-[11px] text-slate-500">{detail}</p>}
    </>
  );

  const containerClass = `rounded-2xl border p-4.5 shadow-xs transition ${
    highlight
      ? 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-100'
      : 'border-slate-200 bg-white hover:border-slate-300'
  } ${href ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : ''}`;

  if (href) {
    return (
      <Link href={href} className={containerClass}>
        {content}
      </Link>
    );
  }

  return <div className={containerClass}>{content}</div>;
}
