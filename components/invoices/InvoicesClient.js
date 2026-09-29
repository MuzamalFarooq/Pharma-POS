'use client';

import { useState } from 'react';
import { Layers, Search, Printer, Eye, X } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function InvoicesClient({ initialInvoices = [], organization, branch }) {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const filtered = invoices.filter((inv) => {
    const query = searchTerm.toLowerCase();
    return (
      !query ||
      inv.invoiceNumber.toLowerCase().includes(query) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Pharmacy Tax Invoices</h1>
        <p className="text-xs text-slate-500">Tenant-aware sequence generator ({organization?.invoicePrefix}-00000X)</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search invoice number or customer..."
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
                <th className="py-3.5 px-4">Invoice Sequence</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-bold text-emerald-700">{inv.invoiceNumber}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inv.customer?.name || 'Walk-in Customer'}</td>
                    <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.status === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {formatCurrency(inv.amount, organization?.currency)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINTABLE INVOICE MODAL */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Official Tax Invoice</h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl text-xs space-y-4 border border-slate-200 font-sans">
              <div className="flex justify-between border-b pb-4">
                <div>
                  <h4 className="font-extrabold text-base text-slate-900">{organization?.name}</h4>
                  <p className="text-slate-500 text-[11px]">{branch?.address || organization?.address}</p>
                  <p className="text-slate-500 text-[11px]">Phone: {organization?.phone}</p>
                  <p className="text-slate-500 text-[11px]">License: {organization?.licenseNumber || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <div className="text-emerald-700 font-black text-sm">{selectedInvoice.invoiceNumber}</div>
                  <div className="text-[11px] text-slate-500">{formatDate(selectedInvoice.createdAt)}</div>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      {selectedInvoice.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Information</span>
                <div className="font-bold text-slate-900">{selectedInvoice.customer?.name || 'Walk-In Customer'}</div>
              </div>

              <div className="space-y-2 border-t border-b py-3">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-slate-400 font-semibold border-b text-[10px] uppercase">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.sale?.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-semibold text-slate-800">{it.medicine?.name}</td>
                        <td className="py-1.5 text-center font-bold">{it.quantity}</td>
                        <td className="py-1.5 text-right font-bold text-slate-900">
                          {formatCurrency(it.total, organization?.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right font-semibold text-slate-700">
                <div>Subtotal: {formatCurrency(selectedInvoice.sale?.subtotal || selectedInvoice.amount, organization?.currency)}</div>
                <div>Tax: {formatCurrency(selectedInvoice.sale?.tax || 0, organization?.currency)}</div>
                <div className="font-extrabold text-base text-slate-900 pt-1 border-t">
                  Grand Total: {formatCurrency(selectedInvoice.amount, organization?.currency)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700"
              >
                <Printer className="w-4 h-4" /> Print Tax Invoice
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
