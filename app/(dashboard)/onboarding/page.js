'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, CheckCircle2, Building, Package, Users, ArrowRight, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const [pharmacyProfile, setPharmacyProfile] = useState({
    licenseNumber: 'PHARM-2026-991',
    invoicePrefix: 'CITY-INV',
    currency: 'USD',
    taxRate: '5.0',
  });

  const [medicineData, setMedicineData] = useState({
    name: 'Amoxicillin 500mg',
    genericName: 'Amoxicillin',
    category: 'Antibiotics',
    batchNumber: 'B2026-001',
    purchasePrice: '10.00',
    sellingPrice: '22.50',
    quantity: '100',
    expiryDate: '2027-12-31',
  });

  const [staffData, setStaffData] = useState({
    name: 'Alex Rivera',
    email: 'cashier@pharmacy.com',
    role: 'CASHIER',
  });

  const handleFinish = () => {
    toast.success('Onboarding complete! Welcome to PharmaPulse SaaS.');
    router.push('/dashboard');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-8">
      {/* ONBOARDING HEADER */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5" /> Guided Setup Wizard
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Welcome to PharmaPulse</h1>
        <p className="text-xs text-slate-500">Configure your pharmacy organization parameters before launching</p>
      </div>

      {/* STEP INDICATOR */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        {[
          { num: 1, label: 'Pharmacy Profile' },
          { num: 2, label: 'Initial Inventory' },
          { num: 3, label: 'Invite Staff' },
          { num: 4, label: 'Finish' },
        ].map((s) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                step >= s.num ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}
            >
              {step > s.num ? <CheckCircle2 className="w-4 h-4" /> : s.num}
            </div>
            <span className={`text-xs font-semibold hidden sm:inline ${step === s.num ? 'text-slate-900 font-bold' : 'text-slate-500'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* STEP CONTENTS */}
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-emerald-600" /> Step 1: Pharmacy Invoicing & Licensing
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pharmacy License Number</label>
                <input
                  type="text"
                  value={pharmacyProfile.licenseNumber}
                  onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, licenseNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Invoice Prefix (e.g. CITY-INV)</label>
                <input
                  type="text"
                  value={pharmacyProfile.invoicePrefix}
                  onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, invoicePrefix: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Currency Code</label>
                <select
                  value={pharmacyProfile.currency}
                  onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, currency: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sales Tax Rate (%)</label>
                <input
                  type="number"
                  value={pharmacyProfile.taxRate}
                  onChange={(e) => setPharmacyProfile({ ...pharmacyProfile, taxRate: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" /> Step 2: Add First Medicine Stock
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medicine Name</label>
                <input
                  type="text"
                  value={medicineData.name}
                  onChange={(e) => setMedicineData({ ...medicineData, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Batch Number</label>
                <input
                  type="text"
                  value={medicineData.batchNumber}
                  onChange={(e) => setMedicineData({ ...medicineData, batchNumber: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Selling Price ($)</label>
                <input
                  type="number"
                  value={medicineData.sellingPrice}
                  onChange={(e) => setMedicineData({ ...medicineData, sellingPrice: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={medicineData.expiryDate}
                  onChange={(e) => setMedicineData({ ...medicineData, expiryDate: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" /> Step 3: Invite Staff Member
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Name</label>
                <input
                  type="text"
                  value={staffData.name}
                  onChange={(e) => setStaffData({ ...staffData, name: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Staff Email</label>
                <input
                  type="email"
                  value={staffData.email}
                  onChange={(e) => setStaffData({ ...staffData, email: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={staffData.role}
                  onChange={(e) => setStaffData({ ...staffData, role: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-sm outline-none"
                >
                  <option value="ADMIN">ADMIN (Full Operational Access)</option>
                  <option value="MANAGER">MANAGER (Daily Ops & Reports)</option>
                  <option value="PHARMACIST">PHARMACIST (Medicine & Inventory)</option>
                  <option value="CASHIER">CASHIER (POS & Sales)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(2)} className="px-4 py-2 border rounded-xl text-xs font-bold">
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 flex items-center gap-1.5"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900">Your Pharmacy Platform is Ready!</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Organization parameters have been configured. You can now process POS checkout sales, manage batches, generate invoices, and view real-time analytics.
            </p>
            <button
              onClick={handleFinish}
              className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all"
            >
              Go to Dashboard Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
