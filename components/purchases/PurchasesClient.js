'use client';

import { useState } from 'react';
import { ShoppingBag, Plus, Search, Calendar, User, Building, X, Loader2, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function PurchasesClient({ initialPurchases = [], suppliers = [], medicines = [], currency = 'USD' }) {
  const [purchases, setPurchases] = useState(initialPurchases);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([
    { medicineId: '', batchNumber: '', quantity: 100, purchasePrice: 10, sellingPrice: 20, expiryDate: '' },
  ]);

  const addItemRow = () => {
    setPurchaseItems([
      ...purchaseItems,
      { medicineId: '', batchNumber: '', quantity: 100, purchasePrice: 10, sellingPrice: 20, expiryDate: '' },
    ]);
  };

  const updateItem = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const removeItemRow = (index) => {
    if (purchaseItems.length === 1) return;
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId,
        invoiceRef,
        items: purchaseItems.map((it) => ({
          medicineId: it.medicineId,
          batchNumber: it.batchNumber,
          quantity: parseInt(it.quantity, 10),
          purchasePrice: parseFloat(it.purchasePrice),
          sellingPrice: parseFloat(it.sellingPrice),
          expiryDate: it.expiryDate,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to create purchase order');
        setSubmitting(false);
        return;
      }

      toast.success(`Purchase ${data.purchase.purchaseNumber} recorded & stock updated!`);
      setPurchases([data.purchase, ...purchases]);
      setShowNewModal(false);
      setSubmitting(false);
    } catch (e) {
      toast.error('An error occurred');
      setSubmitting(false);
    }
  };

  const filtered = purchases.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      !query ||
      p.purchaseNumber.toLowerCase().includes(query) ||
      (p.supplier?.name && p.supplier.name.toLowerCase().includes(query)) ||
      (p.invoiceRef && p.invoiceRef.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Supplier Purchase Orders</h1>
          <p className="text-xs text-slate-500">Record supplier stock shipments and auto-populate inventory batches</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 self-start"
        >
          <Plus className="w-4 h-4" /> Create Purchase Order
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search purchase #, supplier, or invoice ref..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Purchase Ref</th>
                <th className="py-3.5 px-4">Supplier</th>
                <th className="py-3.5 px-4">Invoice Ref</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4 text-right">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No purchase orders recorded yet.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{p.purchaseNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{p.supplier?.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">{p.invoiceRef || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="py-3.5 px-4">{p.items.length} medicines</td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(p.totalAmount, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        COMPLETED
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PURCHASE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Record New Supplier Shipment Purchase</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Select Supplier *</label>
                  <select
                    required
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  >
                    <option value="">Choose supplier company...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Supplier Invoice / Bill Ref</label>
                  <input
                    type="text"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    placeholder="SUP-INV-99120"
                    className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Purchased Medicine Items</h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item Row
                  </button>
                </div>

                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Medicine *</label>
                        <select
                          required
                          value={item.medicineId}
                          onChange={(e) => updateItem(idx, 'medicineId', e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        >
                          <option value="">Choose medicine...</option>
                          {medicines.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Batch Number *</label>
                        <input
                          type="text"
                          required
                          value={item.batchNumber}
                          onChange={(e) => updateItem(idx, 'batchNumber', e.target.value)}
                          placeholder="B2026-99"
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Qty *</label>
                        <input
                          type="number"
                          required
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Cost ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(idx, 'purchasePrice', e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Sell ($) *</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={item.sellingPrice}
                          onChange={(e) => updateItem(idx, 'sellingPrice', e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Expiry Date *</label>
                        <input
                          type="date"
                          required
                          value={item.expiryDate}
                          onChange={(e) => updateItem(idx, 'expiryDate', e.target.value)}
                          className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                        />
                      </div>
                    </div>

                    {purchaseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItemRow(idx)}
                        className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Purchase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
