'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function PlatformSettingsClient({ initialSettings }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [platformName, setPlatformName] = useState(initialSettings.platformName);
  const [supportEmail, setSupportEmail] = useState(initialSettings.supportEmail);
  const [supportPhone, setSupportPhone] = useState(initialSettings.supportPhone);
  const [commissionRate, setCommissionRate] = useState(initialSettings.commissionRate);
  const [maintenanceMode, setMaintenanceMode] = useState(initialSettings.maintenanceMode);
  const [requireLicenseNumber, setRequireLicenseNumber] = useState(initialSettings.requireLicenseNumber);
  const [orderCancellationGraceMinutes, setOrderCancellationGraceMinutes] = useState(
    initialSettings.orderCancellationGraceMinutes
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/owner/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformName,
          supportEmail,
          supportPhone,
          commissionRate: parseFloat(commissionRate),
          maintenanceMode,
          requireLicenseNumber,
          orderCancellationGraceMinutes: parseInt(orderCancellationGraceMinutes, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings.');
      toast.success(data.message);
      router.refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Branding & Identity */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900">Platform Identity & Contact</h2>
        <p className="text-[10px] text-slate-500">Public-facing brand information and support routing</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 text-xs">
          <label className="block font-semibold text-slate-700">
            Platform Name:
            <input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block font-semibold text-slate-700">
            Support Inquiry Email:
            <input
              type="email"
              required
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block font-semibold text-slate-700">
            Support Phone Line:
            <input
              type="text"
              required
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
            />
          </label>

          <label className="block font-semibold text-slate-700">
            Order Cancellation Grace Period (Minutes):
            <input
              type="number"
              min="0"
              max="120"
              value={orderCancellationGraceMinutes}
              onChange={(e) => setOrderCancellationGraceMinutes(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Financial & Commission Policies */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-extrabold text-slate-900">Commission & Service Fees</h2>
        <p className="text-[10px] text-slate-500">Global commission rate applied to reconciled gross order volume</p>

        <div className="mt-4 max-w-sm text-xs">
          <label className="block font-semibold text-slate-700">
            Standard Platform Commission (%):
            <div className="relative mt-1">
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 pr-8 outline-none focus:border-emerald-500"
              />
              <span className="pointer-events-none absolute right-3 top-2.5 font-bold text-slate-400">%</span>
            </div>
          </label>
        </div>
      </div>

      {/* Compliance & Operational Toggles */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900">Compliance & Operational Gates</h2>
        <p className="text-[10px] text-slate-500">Security enforcement and maintenance mode switches</p>

        <div className="space-y-3 pt-2 text-xs">
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-3.5 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={requireLicenseNumber}
              onChange={(e) => setRequireLicenseNumber(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <span className="font-bold text-slate-900 block">Enforce Pharmacy License Registration</span>
              <span className="text-[11px] text-slate-500">Require all pharmacy applicants to submit a valid state/federal pharmacy license number.</span>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/40 p-3.5 hover:bg-rose-50 cursor-pointer">
            <input
              type="checkbox"
              checked={maintenanceMode}
              onChange={(e) => setMaintenanceMode(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <span className="font-bold text-rose-950 block">Maintenance Mode</span>
              <span className="text-[11px] text-rose-800">Pause public tenant onboarding and non-essential background processing for system maintenance.</span>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Platform Settings
        </button>
      </div>
    </form>
  );
}
