'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ChevronDown,
  DollarSign,
  FileCheck,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Pill,
  Settings,
  ShieldAlert,
  ShoppingBag,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

const navGroups = [
  {
    title: 'Core Administration',
    items: [
      { label: 'Overview', href: '/owner', icon: LayoutDashboard },
      {
        label: 'Pharmacies',
        icon: Building2,
        href: '/owner/pharmacies',
        subItems: [
          { label: 'All Pharmacies', href: '/owner/pharmacies' },
          { label: 'Pending Requests', href: '/owner/pharmacy-requests' },
          { label: 'Suspended Pharmacies', href: '/owner/pharmacies?status=SUSPENDED' },
        ],
      },
      { label: 'Users', href: '/owner/users', icon: Users },
      { label: 'Orders', href: '/owner/orders', icon: ShoppingBag },
    ],
  },
  {
    title: 'Commerce & Oversight',
    items: [
      { label: 'Finance & Revenue', href: '/owner/finance', icon: DollarSign },
      { label: 'Global Medicine Catalog', href: '/owner/global-catalog', icon: BookOpen },
      { label: 'Products & Inventory', href: '/owner/products', icon: Pill },
      { label: 'Support & Disputes', href: '/owner/support', icon: LifeBuoy },
      { label: 'Reports & Analytics', href: '/owner/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Security & Operations',
    items: [
      { label: 'Security & Audit Logs', href: '/owner/audit-logs', icon: ShieldAlert },
      { label: 'Notifications Center', href: '/owner/notifications', icon: Bell },
      { label: 'Compliance & Verification', href: '/owner/compliance', icon: FileCheck },
      { label: 'Admin Staff & Access', href: '/owner/staff', icon: UserCheck },
      { label: 'System Health', href: '/owner/health', icon: Activity },
      { label: 'Platform Settings', href: '/owner/settings', icon: Settings },
    ],
  },
];

export default function OwnerShell({ user, hasPharmacyAccess, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pharmaciesExpanded, setPharmaciesExpanded] = useState(true);

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

  const isItemActive = (href) => {
    if (href === '/owner') return pathname === '/owner';
    return pathname.startsWith(href);
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

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-5">
          <Link href="/owner" className="flex items-center gap-3 group">
            <Image
              src="/icon.svg"
              alt="PharmaPulse Logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl shadow-sm shadow-emerald-500/20 shrink-0 group-hover:scale-105 transition-transform"
              priority
            />
            <div>
              <span className="block text-sm font-extrabold tracking-tight text-white">PharmaPulse</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Platform Owner
              </span>
            </div>
          </Link>
          <button
            type="button"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4 text-xs">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.title}
              </p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isItemActive(item.href);

                if (item.subItems) {
                  const isParentActive = pathname.startsWith('/owner/pharmacies') || pathname.startsWith('/owner/pharmacy-requests');
                  return (
                    <div key={item.label} className="space-y-1">
                      <button
                        type="button"
                        onClick={() => setPharmaciesExpanded(!pharmaciesExpanded)}
                        className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 font-semibold transition-colors ${
                          isParentActive
                            ? 'bg-slate-800/80 text-white'
                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="h-4 w-4 text-emerald-400" />
                          <span>{item.label}</span>
                        </span>
                        <ChevronDown
                          className={`h-3.5 w-3.5 transition-transform ${
                            pharmaciesExpanded ? 'rotate-180 text-emerald-400' : 'text-slate-500'
                          }`}
                        />
                      </button>

                      {pharmaciesExpanded && (
                        <div className="ml-5 space-y-1 border-l border-slate-800 pl-3">
                          {item.subItems.map((sub) => {
                            const subActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.label}
                                href={sub.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`block rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                                  subActive
                                    ? 'bg-emerald-600 font-bold text-white'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                {sub.label}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-semibold transition-colors ${
                      active
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/50'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {hasPharmacyAccess && (
          <div className="border-t border-slate-800 p-3">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              <Building2 className="h-4 w-4 text-emerald-400" />
              <span>
                <span className="block font-bold">Pharmacy Workspace</span>
                <span className="block text-[10px] font-normal text-slate-400">Switch to tenant view</span>
              </span>
            </Link>
          </div>
        )}

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-extrabold text-white">
              {user.name?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user.name}</p>
              <p className="truncate text-[10px] text-slate-400">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-50"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Platform Owner Console</p>
              <p className="text-sm font-extrabold text-slate-900">PharmaPulse Unified Administration</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/owner/notifications"
              className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Link>
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 sm:inline-flex">
              Superuser Root
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
