'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';

const availableStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function OrderStatusControls({ orderId, currentStatus }) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = async () => {
    if (selectedStatus === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: selectedStatus, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status.');
      toast.success(data.message);
      setConfirmOpen(false);
      setReason('');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <select
          value={selectedStatus}
          onChange={(e) => {
            setSelectedStatus(e.target.value);
            setConfirmOpen(true);
          }}
          disabled={loading}
          className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
        >
          {availableStatuses.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-base font-extrabold text-slate-900">Change Order Status?</h2>
            <p className="text-xs text-slate-500">
              Update order status from <strong>{currentStatus}</strong> to <strong>{selectedStatus}</strong>.
            </p>
            {selectedStatus === 'CANCELLED' && (
              <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Warning: Cancelling this order will release and restore allocated medicine stock to the inventory.
              </p>
            )}
            <label className="block text-xs font-semibold text-slate-700">
              Reason / Administrative Note:
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optional reason for status intervention..."
                className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs outline-none focus:border-emerald-500"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedStatus(currentStatus);
                  setConfirmOpen(false);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Status
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
