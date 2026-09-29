'use client';

import { useState } from 'react';
import { Package, Plus, Search, Filter, AlertTriangle, Clock, Edit2, X, Loader2, ArrowUpDown } from 'lucide-react';
import { formatCurrency, formatDate, calculateExpiryStatus } from '@/lib/utils';
import { toast } from 'sonner';

export default function InventoryClient({ initialBatches = [], medicines = [], suppliers = [], currency = 'USD' }) {
  const [batches, setBatches] = useState(initialBatches);
  const [searchTerm, setSearchTerm] = useState('');
  const [expiryFilter, setExpiryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // New Batch Form
  const [batchForm, setBatchForm] = useState({
    medicineId: '',
    supplierId: '',
    batchNumber: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    minStock: 10,
    expiryDate: '',
  });

  // Adjust Form
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Stock Correction');

  const filteredBatches = batches.filter((b) => {
    const medName = b.medicine?.name?.toLowerCase() || '';
    const batchNum = b.batchNumber?.toLowerCase() || '';
    const query = searchTerm.toLowerCase();

    const matchesSearch = !query || medName.includes(query) || batchNum.includes(query);

    // Expiry filter
    const exp = calculateExpiryStatus(b.expiryDate);
    let matchesExpiry = true;
    if (expiryFilter === 'EXPIRED') matchesExpiry = exp.status === 'EXPIRED';
    else if (expiryFilter === '30DAYS') matchesExpiry = exp.days <= 30 && exp.days > 0;
    else if (expiryFilter === '90DAYS') matchesExpiry = exp.days <= 90 && exp.days > 0;

    // Stock filter
    let matchesStock = true;
    if (stockFilter === 'LOW') matchesStock = b.quantity <= b.minStock;
    else if (stockFilter === 'OUT') matchesStock = b.quantity <= 0;

    return matchesSearch && matchesExpiry && matchesStock;
  });

  const handleAddBatch = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...batchForm,
        purchasePrice: parseFloat(batchForm.purchasePrice),
        sellingPrice: parseFloat(batchForm.sellingPrice),
        quantity: parseInt(batchForm.quantity, 10),
        minStock: parseInt(batchForm.minStock, 10),
      };

      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create batch');
        setSubmitting(false);
        return;
      }

      toast.success(`Batch ${data.batch.batchNumber} created!`);
      setBatches([data.batch, ...batches]);
      setShowAddBatchModal(false);
      setSubmitting(false);
    } catch (e) {
      toast.error('An error occurred');
      setSubmitting(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!showAdjustModal) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: showAdjustModal.id,
          adjustmentQuantity: parseInt(adjustQty, 10),
          reason: adjustReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Stock adjustment failed');
        setSubmitting(false);
        return;
      }

      toast.success('Stock adjusted successfully');
      setBatches(batches.map((b) => (b.id === showAdjustModal.id ? { ...b, quantity: data.batch.quantity } : b)));
      setShowAdjustModal(null);
      setSubmitting(false);
    } catch (e) {
      toast.error('Failed to adjust stock');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Inventory & Batch Management</h1>
          <p className="text-xs text-slate-500">Track stock levels, purchase prices, suppliers, and expiry dates per batch</p>
        </div>

        <button
          onClick={() => setShowAddBatchModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Add Inventory Batch
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search medicine or batch number..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Stock Levels</option>
            <option value="LOW">Low Stock Only</option>
            <option value="OUT">Out of Stock</option>
          </select>

          <select
            value={expiryFilter}
            onChange={(e) => setExpiryFilter(e.target.value)}
            className="p-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="ALL">All Expiry Dates</option>
            <option value="EXPIRED">Expired Batches</option>
            <option value="30DAYS">Expiring in 30 Days</option>
            <option value="90DAYS">Expiring in 90 Days</option>
          </select>
        </div>
      </div>

      {/* Inventory Batches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Medicine</th>
                <th className="py-3.5 px-4">Batch Number</th>
                <th className="py-3.5 px-4">Cost Price</th>
                <th className="py-3.5 px-4">Sell Price</th>
                <th className="py-3.5 px-4">Quantity Left</th>
                <th className="py-3.5 px-4">Expiry Date</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No inventory batches match current filters.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const exp = calculateExpiryStatus(b.expiryDate);
                  const isLow = b.quantity <= b.minStock;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{b.medicine?.name || 'Unknown'}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{b.batchNumber}</td>
                      <td className="py-3.5 px-4 text-slate-500">{formatCurrency(b.purchasePrice, currency)}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{formatCurrency(b.sellingPrice, currency)}</td>
                      <td className="py-3.5 px-4">
                        <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-900'}`}>
                          {b.quantity} {isLow && <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded ml-1">Low</span>}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            exp.status === 'EXPIRED'
                              ? 'bg-rose-100 text-rose-800'
                              : exp.status === 'CRITICAL'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {formatDate(b.expiryDate)} ({exp.label})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{b.supplier?.name || '-'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setShowAdjustModal(b);
                            setAdjustQty(0);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px]"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD BATCH MODAL */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Add Inventory Batch</h3>
              <button onClick={() => setShowAddBatchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddBatch} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Medicine *</label>
                <select
                  required
                  value={batchForm.medicineId}
                  onChange={(e) => setBatchForm({ ...batchForm, medicineId: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                >
                  <option value="">Choose medicine...</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.strength || 'Standard'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Batch Number *</label>
                  <input
                    type="text"
                    required
                    value={batchForm.batchNumber}
                    onChange={(e) => setBatchForm({ ...batchForm, batchNumber: e.target.value })}
                    placeholder="B2026-AMX-01"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier</label>
                  <select
                    value={batchForm.supplierId}
                    onChange={(e) => setBatchForm({ ...batchForm, supplierId: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  >
                    <option value="">Choose supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cost Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.purchasePrice}
                    onChange={(e) => setBatchForm({ ...batchForm, purchasePrice: e.target.value })}
                    placeholder="12.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selling Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={batchForm.sellingPrice}
                    onChange={(e) => setBatchForm({ ...batchForm, sellingPrice: e.target.value })}
                    placeholder="25.00"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity Stock *</label>
                  <input
                    type="number"
                    required
                    value={batchForm.quantity}
                    onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })}
                    placeholder="100"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={batchForm.expiryDate}
                    onChange={(e) => setBatchForm({ ...batchForm, expiryDate: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Stock Quantity Adjustment</h3>
              <button onClick={() => setShowAdjustModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-900 block">{showAdjustModal.medicine?.name}</span>
                <span className="text-slate-500 font-mono text-[11px]">Batch: {showAdjustModal.batchNumber} • Current Stock: {showAdjustModal.quantity}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Adjustment Delta (+/-)</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. +10 or -5"
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none text-sm font-bold"
                />
                <span className="text-[10px] text-slate-400">Use positive numbers to add stock, negative to deduct.</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Audit Log</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Damage, return, physical count discrepancy..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(null)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
