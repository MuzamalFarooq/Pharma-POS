'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateTicketModal({ pharmacies = [] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [organizationId, setOrganizationId] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/owner/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          description,
          category,
          priority,
          organizationId: organizationId || undefined,
          customerEmail: customerEmail || undefined,
          customerName: customerName || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create ticket.');
      toast.success('Support ticket created successfully.');
      setOpen(false);
      setSubject('');
      setDescription('');
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
        <Plus className="h-4 w-4" /> New Ticket / Dispute
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-extrabold text-slate-900">Create Support Ticket or Dispute</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">
                Subject:
                <input
                  required
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Summary of complaint, dispute, or support issue..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Category:
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ORDER_DISPUTE">Order Dispute</option>
                    <option value="REFUND_REQUEST">Refund Request</option>
                    <option value="PHARMACY_SUPPORT">Pharmacy Support</option>
                    <option value="TECHNICAL_ISSUE">Technical Issue</option>
                  </select>
                </label>
                <label className="block font-semibold text-slate-700">
                  Priority:
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Related Pharmacy (optional):
                <select
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
                >
                  <option value="">No pharmacy association</option>
                  {pharmacies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Customer Name (optional):
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="block font-semibold text-slate-700">
                  Customer Email (optional):
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-emerald-500"
                  />
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Detailed Description:
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide background, order references, or evidence..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
                />
              </label>
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
                Submit Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
