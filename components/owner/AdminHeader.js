import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminHeader({
  title,
  description,
  icon: Icon,
  badge = null,
  backHref = null,
  backLabel = 'Back',
  actions = null,
}) {
  return (
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {backHref && (
          <Link
            href={backHref}
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> {backLabel}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          {Icon && (
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <Icon className="h-5 w-5" />
            </div>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {badge && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
              {badge}
            </span>
          )}
        </div>
        {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
