'use client';

import { useState } from 'react';
import { Pill, Plus, Search, Filter, X, Edit, Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MedicinesClient({ initialMedicines = [], categories = [] }) {
  const [medicines, setMedicines] = useState(initialMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    brand: '',
    categoryId: '',
    dosageForm: 'Capsule',
    strength: '500mg',
    manufacturer: '',
    barcode: '',
    sku: '',
    prescriptionRequired: false,
    description: '',
  });

  const filtered = medicines.filter((m) => {
    const matchesCategory = selectedCategory === 'ALL' || m.categoryId === selectedCategory;
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !query ||
      m.name.toLowerCase().includes(query) ||
      (m.genericName && m.genericName.toLowerCase().includes(query)) ||
      (m.barcode && m.barcode.toLowerCase().includes(query));
    return matchesCategory && matchesSearch;
  });

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create medicine');
        setSubmitting(false);
        return;
      }

      toast.success(`Created medicine ${data.medicine.name}`);
      setMedicines([data.medicine, ...medicines]);
      setShowAddModal(false);
      setSubmitting(false);
      setFormData({
        name: '',
        genericName: '',
        brand: '',
        categoryId: '',
        dosageForm: 'Capsule',
        strength: '',
        manufacturer: '',
        barcode: '',
        sku: '',
        prescriptionRequired: false,
        description: '',
      });
    } catch (e) {
      toast.error('An error occurred');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Medicine Product Catalog</h1>
          <p className="text-xs text-slate-500">Manage master product information across your pharmacy</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Add New Medicine
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicine name, generic name, or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Medicines Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Medicine Name</th>
                <th className="py-3.5 px-4">Generic Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Dosage / Strength</th>
                <th className="py-3.5 px-4">Barcode / SKU</th>
                <th className="py-3.5 px-4">Total Batches</th>
                <th className="py-3.5 px-4 text-center">Rx Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No medicines found in catalog.
                  </td>
                </tr>
              ) : (
                filtered.map((med) => (
                  <tr key={med.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{med.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{med.genericName || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px]">
                        {med.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">{med.dosageForm} ({med.strength || 'Standard'})</td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{med.barcode || med.sku || '-'}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-700">{med.batches?.length || 0} batches</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {med.prescriptionRequired ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">Yes (Rx)</span>
                      ) : (
                        <span className="text-slate-400">OTC</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD MEDICINE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add New Medicine to Product Master</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Medicine Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Amoxicillin 500mg Caps"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="Amoxicillin Trihydrate"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage Form</label>
                  <input
                    type="text"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="Capsule / Tablet / Syrup"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Strength</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="500mg / 10ml"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Barcode</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="890123456789"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="AMX-500-CAP"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="rxReq"
                  checked={formData.prescriptionRequired}
                  onChange={(e) => setFormData({ ...formData, prescriptionRequired: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <label htmlFor="rxReq" className="font-semibold text-slate-700">
                  Prescription Required (Rx Only)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
