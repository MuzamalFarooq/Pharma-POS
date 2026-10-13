'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RotateCcw, ShieldOff } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminStaffControls({ admin }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const toggleStatus = async () => {
    setLoading(true);
    const newStatus = admin.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    try {
      const res = await fetch(`/api/owner/staff/${encodeURIComponent(admin.id)}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update admin status.');
      toast.success(newStatus === 'ACTIVE' ? 'Account enabled.' : 'Account disabled.');
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleStatus}
      disabled={loading}
      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold disabled:opacity-50 ${
        admin.status === 'ACTIVE'
          ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
          : 'bg-emerald-600 text-white hover:bg-emerald-700'
      }`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : admin.status === 'ACTIVE' ? (
        <>
          <ShieldOff className="h-3 w-3" /> Disable
        </>
      ) : (
        <>
          <RotateCcw className="h-3 w-3" /> Enable
        </>
      )}
    </button>
  );
}
