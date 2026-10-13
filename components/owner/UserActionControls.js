'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2, RotateCcw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

export default function UserActionControls({ user, isSuspended = false }) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('');

  const triggerReset = async () => {
    setLoadingAction('RESET');
    try {
      const res = await fetch(`/api/owner/users/${encodeURIComponent(user.id)}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger reset.');
      toast.success(data.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction('');
    }
  };

  const handleStatusChange = async (action) => {
    setLoadingAction(action);
    try {
      const res = await fetch(`/api/owner/users/${encodeURIComponent(user.id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Status update failed.');
      toast.success(data.message);
      setDialogOpen(false);
      setReason('');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingAction('');
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={triggerReset}
          disabled={Boolean(loadingAction)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          title="Send password reset email to user"
        >
          {loadingAction === 'RESET' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5 text-slate-500" />}
          Reset Password
        </button>

        {isSuspended ? (
          <button
            type="button"
            onClick={() => handleStatusChange('REACTIVATE')}
            disabled={Boolean(loadingAction)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === 'REACTIVATE' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            disabled={Boolean(loadingAction)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" />
            Suspend
          </button>
        )}
      </div>

      {dialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleStatusChange('SUSPEND');
            }}
            className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl"
          >
            <h2 className="text-base font-extrabold text-slate-900">Suspend User Account Access?</h2>
            <p className="text-xs text-slate-500">
              Suspending <strong>{user.name}</strong> ({user.email}) will disable their pharmacy memberships and invalidate their current login sessions.
            </p>
            <label className="block text-xs font-semibold text-slate-700">
              Reason for suspension:
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State the administrative reason for this restriction..."
                className="mt-1.5 w-full rounded-xl border border-slate-300 p-2.5 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDialogOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={Boolean(loadingAction) || !reason.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {loadingAction === 'SUSPEND' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Suspension
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
