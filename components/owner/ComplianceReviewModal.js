'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ComplianceReviewModal({ organization }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('VERIFIED');
  const [licenseNumber, setLicenseNumber] = useState(organization.licenseNumber || '');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/compliance/${encodeURIComponent(organization.id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          licenseNumber,
          expiryDate: expiryDate || undefined,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review.');
      toast.success('Compliance review recorded successfully.');
      setOpen(false);
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
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        <FileCheck className="h-3.5 w-3.5 text-emerald-600" />
        Log Review
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900">Record Compliance Review</h2>
                <p className="text-[11px] text-slate-500">{organization.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="block font-semibold text-slate-700">
                License Review Outcome:
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-2 outline-none focus:border-emerald-500"
                >
                  <option value="VERIFIED">Verified & Compliant</option>
                  <option value="PENDING_REVIEW">Needs Further Review</option>
                  <option value="EXPIRED">License Expired</option>
                  <option value="REJECTED">License Fraudulent / Rejected</option>
                </select>
              </label>

              <label className="block font-semibold text-slate-700">
                Pharmacy License / Reg Number:
                <input
                  type="text"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. PHARM-REG-84920"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block font-semibold text-slate-700">
                License Expiration Date:
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-emerald-500"
                />
              </label>

              <label className="block font-semibold text-slate-700">
                Verification Notes & Follow-up:
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="State review findings, regulatory registry check outcome..."
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2 outline-none focus:border-emerald-500"
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Save Outcome
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
