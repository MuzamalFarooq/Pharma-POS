'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, LogOut, Bell, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardHeader({ user, organization, branch, role, branches = [] }) {
  const router = useRouter();
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.success('Signed out safely');
      router.push('/login');
      router.refresh();
    } catch (e) {
      toast.error('Logout error');
      setLoggingOut(false);
    }
  };

  const handleSwitchBranch = async (branchId) => {
    try {
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: organization.id, branchId }),
      });

      if (res.ok) {
        toast.success('Switched active branch context');
        setBranchDropdownOpen(false);
        router.refresh();
      }
    } catch (e) {
      toast.error('Failed to switch branch');
    }
  };

  const roleColors = {
    OWNER: 'bg-amber-100 text-amber-800 border-amber-300',
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-300',
    PHARMACIST: 'bg-teal-100 text-teal-800 border-teal-300',
    CASHIER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    STAFF: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Left: Organization & Active Branch Context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-black flex items-center justify-center text-xs border border-emerald-200">
            {organization?.name ? organization.name.substring(0, 2).toUpperCase() : 'PH'}
          </div>
          <div>
            <span className="font-bold text-sm text-slate-900 block leading-snug">
              {organization?.name || 'Pharmacy Organization'}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Tenant ID: <span className="text-emerald-700 font-semibold">{organization?.code || 'TENANT'}</span>
            </span>
          </div>
        </div>

        {/* Branch Selector */}
        <div className="relative">
          <button
            onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Branch: <strong className="text-slate-900">{branch?.name || 'Main Branch'}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {branchDropdownOpen && branches.length > 0 && (
            <div className="absolute left-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl py-1.5 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100">
                Switch Active Store Branch
              </div>
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => handleSwitchBranch(b.id)}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center justify-between"
                >
                  <span className="truncate">{b.name} ({b.code})</span>
                  {b.id === branch?.id && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: User Profile & Actions */}
      <div className="flex items-center gap-4">
        {/* Role Badge */}
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${roleColors[role] || roleColors.STAFF}`}>
          {role || 'STAFF'}
        </span>

        {/* User Card */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
            {user?.name ? user.name.substring(0, 1).toUpperCase() : 'U'}
          </div>
          <div className="hidden md:block">
            <span className="font-bold text-xs text-slate-900 block leading-snug">{user?.name}</span>
            <span className="text-[10px] text-slate-500 block truncate max-w-[140px]">{user?.email}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Sign out of pharmacy session"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
