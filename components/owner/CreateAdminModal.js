'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';

const availablePermissions = [
  { key: 'view_pharmacies', label: 'View Pharmacies' },
  { key: 'approve_pharmacies', label: 'Approve Pharmacy Applications' },
  { key: 'suspend_pharmacies', label: 'Suspend Pharmacies' },
  { key: 'view_users', label: 'View Platform Users' },
  { key: 'manage_orders', label: 'Manage Orders' },
  { key: 'view_finance', label: 'View Financial Reports' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'view_audit_logs', label: 'View Security Audit Logs' },
];

export default function CreateAdminModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [selectedPermissions, setSelectedPermissions] = useState([
    'view_pharmacies',
    'view_users',
    'manage_orders',
  ]);

  const togglePermission = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/owner/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          role,
          permissions: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create administrator.');
      toast.success('Platform administrator created successfully.');
      setOpen(false);
      setName('');
      setEmail('');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
      >
        <Plus className="h-4 w-4" /> Add Administrator
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">Add Platform Administrator</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Full Name:
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Jenkins"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block font-semibold text-slate-700">
                  Email Address:
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="s.jenkins@pharmapulse.com"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Administrative Role:
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2.5 outline-none focus:border-emerald-500"
                >
                  <option value="ADMIN">Platform Administrator</option>
                  <option value="SUPERVISOR">Operations Supervisor</option>
                  <option value="SUPPORT_SPECIALIST">Support & Dispute Specialist</option>
                  <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                  <option value="FINANCE_OFFICER">Finance & Reconciliation Officer</option>
                </select>
              </label>

              <div>
                <p className="font-semibold text-slate-700 mb-2">Granular Permissions Granted:</p>
                <div className="grid grid-cols-2 gap-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                  {availablePermissions.map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-slate-700">
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.key)}
                        onChange={() => togglePermission(perm.key)}
                        className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create Administrator
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
