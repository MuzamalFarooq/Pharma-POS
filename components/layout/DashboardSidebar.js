'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Pill,
  Package,
  Layers,
  ShoppingBag,
  FileText,
  Users,
  Building,
  UserCheck,
  Building2,
  TrendingUp,
  ShieldAlert,
  Settings,
  Sparkles,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasPermission, PERMISSIONS } from '@/lib/rbac';

export default function DashboardSidebar({ userRole, isOpen = false, onClose }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Point of Sale (POS)', href: '/pos', icon: ShoppingCart, highlight: true, permission: PERMISSIONS.SALES_CREATE },
    { name: 'Medicines Catalog', href: '/medicines', icon: Pill, permission: PERMISSIONS.INVENTORY_READ },
    { name: 'Inventory & Batches', href: '/inventory', icon: Package, permission: PERMISSIONS.INVENTORY_READ },
    { name: 'Purchases (Suppliers)', href: '/purchases', icon: ShoppingBag, permission: PERMISSIONS.PURCHASES_READ },
    { name: 'Sales Transactions', href: '/sales', icon: FileText, permission: PERMISSIONS.SALES_READ },
    { name: 'Customer Orders', href: '/orders', icon: ShoppingBag, permission: PERMISSIONS.SALES_CREATE },
    { name: 'Invoices Generator', href: '/invoices', icon: Layers, permission: PERMISSIONS.SALES_READ },
    { name: 'Customers Ledger', href: '/customers', icon: Users, permission: PERMISSIONS.CUSTOMERS_READ },
    { name: 'Suppliers Directory', href: '/suppliers', icon: Building, permission: PERMISSIONS.SUPPLIERS_READ },
    { name: 'Staff Management', href: '/staff', icon: UserCheck, permission: PERMISSIONS.USERS_MANAGE },
    { name: 'Branch Locations', href: '/branches', icon: Building2, permission: PERMISSIONS.BRANCHES_MANAGE },
    { name: 'Reports & Analytics', href: '/reports', icon: TrendingUp, permission: PERMISSIONS.REPORTS_READ },
    { name: 'Audit Compliance Log', href: '/audit', icon: ShieldAlert, permission: PERMISSIONS.AUDIT_READ },
    { name: 'Pharmacy Settings', href: '/settings', icon: Settings, permission: PERMISSIONS.SETTINGS_MANAGE },
  ];

  return (
    <aside
      className={cn(
        'bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out z-50',
        'fixed inset-y-0 left-0 w-72 h-full shadow-2xl lg:shadow-none',
        'lg:static lg:w-64 lg:h-screen lg:sticky lg:top-0 lg:translate-x-0 shrink-0',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 sm:px-5 flex items-center justify-between border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold text-base text-white tracking-tight block leading-none">
              PharmaPulse
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">Cloud SaaS Platform</span>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(userRole, item.permission)) {
            return null;
          }

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/20'
                  : item.highlight
                  ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/80 border border-emerald-800/60'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200')} />
                <span>{item.name}</span>
              </div>
              {item.highlight && !isActive && (
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-bold px-1.5 py-0.5 rounded uppercase">Fast</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Status / Tenant Indicator */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <Link
          href="/onboarding"
          onClick={onClose}
          className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-[11px]">Pharmacy Onboarding</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
        </Link>
      </div>
    </aside>
  );
}
