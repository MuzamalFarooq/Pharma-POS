'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RotateCcw, ShieldOff, X } from 'lucide-react';
import { toast } from 'sonner';

const actions = {
  APPROVE: { label: 'Approve', icon: Check, style: 'bg-emerald-600 text-white hover:bg-emerald-700' },
  REJECT: { label: 'Reject', icon: X, style: 'border border-rose-200 bg-white text-rose-700 hover:bg-rose-50' },
  SUSPEND: { label: 'Suspend', icon: ShieldOff, style: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50' },
  REACTIVATE: { label: 'Reactivate', icon: RotateCcw, style: 'bg-emerald-600 text-white hover:bg-emerald-700' },
};

export default function PharmacyDecisionControls({ organizationId, status }) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState('');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const submitAction = async (action, reason = '') => {
    setPendingAction(action);
    try {
      const response = await fetch(`/api/owner/pharmacies/${encodeURIComponent(organizationId)}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, rejectionReason: reason }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to update pharmacy status.');

      toast.success(result.message);
      setRejectDialogOpen(false);
      setRejectionReason('');
      router.refresh();
    } catch (error) {
      toast.error(error.message || 'Unable to update pharmacy status.');
    } finally {
      setPendingAction('');
    }
  };

  const availableActions = status === 'PENDING'
    ? ['APPROVE', 'REJECT']
    : status === 'ACTIVE'
      ? ['SUSPEND']
      : status === 'SUSPENDED'
        ? ['REACTIVATE']
        : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {availableActions.map((action) => {
          const { label, icon: Icon, style } = actions[action];
          const loading = pendingAction === action;
          return (
            <button
              key={action}
              type="button"
              disabled={Boolean(pendingAction)}
              onClick={() => action === 'REJECT' ? setRejectDialogOpen(true) : submitAction(action)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${style}`}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {label}
            </button>
          );
        })}
      </div>

      {rejectDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submitAction('REJECT', rejectionReason);
            }}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reject-pharmacy-title"
          >
            <div>
              <h2 id="reject-pharmacy-title" className="text-base font-extrabold text-slate-900">Reject pharmacy request?</h2>
              <p className="mt-1 text-xs leading-5 text-slate-500">The registration will be retained and the pharmacy owner will not be able to access pharmacy tools.</p>
            </div>
            <label className="block text-xs font-semibold text-slate-700">
              Rejection reason <span className="font-normal text-slate-400">(optional)</span>
              <textarea
                rows={4}
                maxLength={2000}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className="mt-1.5 w-full resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                placeholder="Add a reason to include in the audit record"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setRejectDialogOpen(false)} disabled={Boolean(pendingAction)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="submit" disabled={Boolean(pendingAction)} className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50">
                {pendingAction === 'REJECT' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm rejection
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
