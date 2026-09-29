'use client';

import { useState } from 'react';
import { FileText, Search, RotateCcw, Eye, X, Loader2, Calendar } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

export default function SalesClient({ initialSales = [], currency = 'USD', userRole }) {
  const [sales, setSales] = useState(initialSales);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSaleModal, setSelectedSaleModal] = useState(null);
  const [refundingSale, setRefundingSale] = useState(null);
  const [refundReason, setRefundReason] = useState('Customer Return');
  const [submitting, setSubmitting] = useState(false);

  const filtered = sales.filter((s) => {
    const query = searchTerm.toLowerCase();
    return (
      !query ||
      s.saleNumber.toLowerCase().includes(query) ||
      (s.customer?.name && s.customer.name.toLowerCase().includes(query)) ||
      (s.cashier?.name && s.cashier.name.toLowerCase().includes(query))
    );
  });

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!refundingSale) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/sales/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId: refundingSale.id, reason: refundReason }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Refund failed');
        setSubmitting(false);
        return;
      }

      toast.success(`Sale ${refundingSale.saleNumber} refunded & inventory stock restored!`);
      setSales(sales.map((s) => (s.id === refundingSale.id ? { ...s, status: 'REFUNDED' } : s)));
      setRefundingSale(null);
      setSubmitting(false);
    } catch (e) {
      toast.error('An error occurred');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales & Transaction History</h1>
        <p className="text-xs text-slate-500">View POS receipts, cashier sales audit trail, and process customer refunds</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search sale #, customer, or cashier..."
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
                <th className="py-3.5 px-4">Sale Ref</th>
                <th className="py-3.5 px-4">Invoice #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Cashier</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No sales transactions recorded.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{s.saleNumber}</td>
                    <td className="py-3.5 px-4 font-mono">{s.invoices[0]?.invoiceNumber || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-900 font-bold">{s.customer?.name || 'Walk-In'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{s.cashier?.name}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDateTime(s.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                        {s.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(s.total, currency)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          s.status === 'REFUNDED' ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedSaleModal(s)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {s.status !== 'REFUNDED' && (
                        <button
                          onClick={() => setRefundingSale(s)}
                          className="px-2.5 py-1 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Refund
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SALE DETAIL MODAL */}
      {selectedSaleModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Sale Details ({selectedSaleModal.saleNumber})</h3>
              <button onClick={() => setSelectedSaleModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer</span>
                  <span className="font-bold text-slate-900">{selectedSaleModal.customer?.name || 'Walk-in Customer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Cashier</span>
                  <span className="font-bold text-slate-900">{selectedSaleModal.cashier?.name}</span>
                </div>
              </div>

              <div className="space-y-1 border-t border-b py-2">
                <span className="font-bold text-slate-700 block mb-1">Purchased Items:</span>
                {selectedSaleModal.items.map((it, i) => (
                  <div key={i} className="flex justify-between p-2 rounded bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{it.medicine?.name}</div>
                      <div className="text-[10px] text-slate-500">Batch: {it.batch?.batchNumber} • x{it.quantity}</div>
                    </div>
                    <div className="font-bold text-slate-900">{formatCurrency(it.total, currency)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-right pt-1 font-semibold text-slate-700">
                <div>Subtotal: {formatCurrency(selectedSaleModal.subtotal, currency)}</div>
                <div>Tax: {formatCurrency(selectedSaleModal.tax, currency)}</div>
                <div className="font-extrabold text-base text-slate-900 pt-1 border-t">
                  Total Paid: {formatCurrency(selectedSaleModal.total, currency)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REFUND MODAL */}
      {refundingSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900">Process Sale Refund</h3>
              <button onClick={() => setRefundingSale(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-3 text-xs">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                Are you sure you want to refund <strong>{refundingSale.saleNumber}</strong> for{' '}
                <strong>{formatCurrency(refundingSale.total, currency)}</strong>? Stock quantity will be restored to inventory batches automatically.
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Refund</label>
                <input
                  type="text"
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Damaged package, customer return, wrong item..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundingSale(null)}
                  className="px-3 py-2 rounded-xl border border-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
