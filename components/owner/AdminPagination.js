'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminPagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 20,
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1 && totalItems <= pageSize) return null;

  const createPageUrl = (pageNumber) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(pageNumber));
    return `${pathname}?${params.toString()}`;
  };

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:px-6">
      <div className="text-xs text-slate-500">
        Showing <span className="font-bold text-slate-900">{totalItems > 0 ? startItem : 0}</span> to{' '}
        <span className="font-bold text-slate-900">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-1.5">
        <Link
          href={createPageUrl(Math.max(1, currentPage - 1))}
          aria-disabled={currentPage <= 1}
          className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold ${
            currentPage <= 1
              ? 'pointer-events-none text-slate-300'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ChevronLeft className="h-3.5 w-3.5" /> Previous
        </Link>
        <span className="px-2 text-xs font-semibold text-slate-600">
          Page {currentPage} of {totalPages || 1}
        </span>
        <Link
          href={createPageUrl(Math.min(totalPages, currentPage + 1))}
          aria-disabled={currentPage >= totalPages}
          className={`inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold ${
            currentPage >= totalPages
              ? 'pointer-events-none text-slate-300'
              : 'text-slate-700 hover:bg-slate-50'
          }`}
        >
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
