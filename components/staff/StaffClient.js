'use client';

import { useState } from 'react';
import { UserCheck, Plus, Search, ShieldCheck, Mail, Building, X, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function StaffClient({ initialMembers = [], branches = [], userRole, currentUserId }) {
  const [members, setMembers] = useState(initialMembers);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'CASHIER',
    branchId: branches[0]?.id || '',
  });

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to add staff member');
        setSubmitting(false);
        return;
      }

      toast.success(`Staff member ${data.member.user.name} added as ${data.member.role}`);
      setMembers([data.member, ...members]);
      setShowInviteModal(false);
      setSubmitting(false);
      setFormData({ name: '', email: '', role: 'CASHIER', branchId: branches[0]?.id || '' });
    } catch (e) {
      toast.error('An error occurred');
      setSubmitting(false);
    }
  };

  const filtered = members.filter((m) => {
    const query = searchTerm.toLowerCase();
    return (
      !query ||
      (m.user?.name && m.user.name.toLowerCase().includes(query)) ||
      (m.user?.email && m.user.email.toLowerCase().includes(query))
    );
  });

  const roleBadges = {
    OWNER: 'bg-amber-100 text-amber-800 border-amber-300',
    ADMIN: 'bg-purple-100 text-purple-800 border-purple-300',
    MANAGER: 'bg-blue-100 text-blue-800 border-blue-300',
    PHARMACIST: 'bg-teal-100 text-teal-800 border-teal-300',
    CASHIER: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    STAFF: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Staff RBAC Management</h1>
          <p className="text-xs text-slate-500">Manage pharmacy staff accounts, assigned store branches, and operational roles</p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add / Invite Staff Member
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search staff name or email..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Assigned Store Branch</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{m.user?.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{m.user?.email}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${roleBadges[m.role] || roleBadges.STAFF}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{m.branch?.name || 'Main Branch'}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-500">{formatDate(m.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-4 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Staff Account</h3>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleInviteStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Alex Rivera"
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="cashier@citycare.com"
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Permission Level *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none font-bold text-slate-800"
                >
                  <option value="ADMIN">ADMIN (Full Operational Control)</option>
                  <option value="MANAGER">MANAGER (Daily Ops & Reports)</option>
                  <option value="PHARMACIST">PHARMACIST (Medicine & Inventory)</option>
                  <option value="CASHIER">CASHIER (POS & Sales)</option>
                  <option value="STAFF">STAFF (Read Operations)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Store Branch</label>
                <select
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
