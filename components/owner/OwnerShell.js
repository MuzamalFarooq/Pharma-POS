'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const navigation = [
  { label: 'Overview', href: '/owner', icon: LayoutDashboard },
  { label: 'Pharmacies', href: '/owner/pharmacies', icon: Building2 },
  { label: 'Pharmacy Requests', href: '/owner/pharmacy-requests', icon: ClipboardCheck },
];

export default function OwnerShell({ user, hasPharmacyAccess, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = async () => {
    setLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Sign out failed.');
      router.push('/login');
      router.refresh();
    } catch (error) {
      toast.error(error.message || 'Sign out failed.');
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 text-slate-950">
              <Pill className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-sm font-extrabold leading-none text-white">PharmaPulse</span>
              <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-emerald-400">Platform Owner</span>
            </div>
          </div>
          <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Platform</p>
          {navigation.map(({ label, href, icon: Icon }) => {
            const active = href === '/owner' ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        {hasPharmacyAccess && (
          <div className="border-t border-slate-800 p-3">
            <Link href="/dashboard" className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-3 text-xs font-semibold text-slate-200 hover:bg-slate-800">
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>
                <span className="block">Pharmacy Dashboard</span>
                <span className="mt-0.5 block text-[10px] font-normal text-slate-400">Switch to your pharmacy workspace</span>
              </span>
            </Link>
          </div>
        )}

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-bold text-white">
              {user.name?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
            <button type="button" onClick={logout} disabled={loggingOut} className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50" title="Sign out" aria-label="Sign out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation">
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Platform Owner Dashboard</p>
              <p className="text-sm font-bold text-slate-900">PharmaPulse Administration</p>
            </div>
          </div>
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 sm:inline-flex">
            Platform access
          </span>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
