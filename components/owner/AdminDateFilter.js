'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

const intervals = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
];

export default function AdminDateFilter({ selected = '30d' }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (val) => {
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'all') {
      params.delete('range');
    } else {
      params.set('range', val);
    }
    params.delete('page'); // Reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 shadow-xs">
      <Calendar className="ml-2 h-3.5 w-3.5 text-slate-400" />
      <div className="flex items-center gap-1">
        {intervals.map((item) => {
          const active = (selected === item.value) || (!searchParams.get('range') && item.value === '30d');
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => handleSelect(item.value)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                active
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
