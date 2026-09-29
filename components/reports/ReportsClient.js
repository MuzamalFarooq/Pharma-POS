'use client';

import { useState } from 'react';
import { TrendingUp, DollarSign, Package, AlertTriangle, FileText, Download, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ReportsClient({ sales = [], purchases = [], batches = [], currency = 'USD', taxRate = 0 }) {
  const [reportType, setReportType] = useState('SALES');

  // Metrics
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalTaxCollected = sales.reduce((acc, s) => acc + s.tax, 0);
  const totalPurchasesCost = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const estimatedProfit = Math.max(0, totalRevenue - totalTaxCollected - (totalPurchasesCost * 0.7));

  // Payment method breakdown
  const paymentBreakdown = sales.reduce((acc, s) => {
    acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
    return acc;
  }, {});

  // Top selling medicines
  const medicineSalesMap = {};
  sales.forEach((s) => {
    s.items.forEach((it) => {
      const name = it.medicine?.name || 'Unknown';
      medicineSalesMap[name] = (medicineSalesMap[name] || 0) + it.quantity;
    });
  });

  const topMedicines = Object.entries(medicineSalesMap)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Business Reports & Analytics</h1>
          <p className="text-xs text-slate-500">Real-time revenue, gross profit, stock movement, and tax summaries</p>
        </div>

        <button
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center gap-1.5 self-start"
        >
          <Printer className="w-4 h-4" /> Export / Print Report
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Gross Revenue</span>
          <div className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalRevenue, currency)}</div>
          <span className="text-[10px] text-slate-400">{sales.length} Total Completed Sales</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Estimated Gross Profit</span>
          <div className="text-2xl font-extrabold text-slate-900">{formatCurrency(estimatedProfit, currency)}</div>
          <span className="text-[10px] text-emerald-600 font-semibold">After COGS & Tax</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Tax Collected</span>
          <div className="text-2xl font-extrabold text-blue-600">{formatCurrency(totalTaxCollected, currency)}</div>
          <span className="text-[10px] text-slate-400">Tax Rate: {taxRate}%</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-xs font-semibold text-slate-500 uppercase">Purchases Investment</span>
          <div className="text-2xl font-extrabold text-teal-600">{formatCurrency(totalPurchasesCost, currency)}</div>
          <span className="text-[10px] text-slate-400">{purchases.length} Orders</span>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setReportType('SALES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'SALES' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border'
          }`}
        >
          Sales & Invoices Report
        </button>
        <button
          onClick={() => setReportType('TOP_MEDS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'TOP_MEDS' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border'
          }`}
        >
          Top Selling Medicines
        </button>
        <button
          onClick={() => setReportType('PAYMENT')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            reportType === 'PAYMENT' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-100 border'
          }`}
        >
          Payment Methods Summary
        </button>
      </div>

      {/* Report Content Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        {reportType === 'SALES' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Completed Sales Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b text-slate-500 font-semibold uppercase">
                  <tr>
                    <th className="py-3 px-3">Sale #</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Subtotal</th>
                    <th className="py-3 px-3">Discount</th>
                    <th className="py-3 px-3">Tax</th>
                    <th className="py-3 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-medium text-slate-700">
                  {sales.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-3 font-bold text-emerald-700">{s.saleNumber}</td>
                      <td className="py-3 px-3 text-slate-500">{formatDate(s.createdAt)}</td>
                      <td className="py-3 px-3">{formatCurrency(s.subtotal, currency)}</td>
                      <td className="py-3 px-3">{formatCurrency(s.discount, currency)}</td>
                      <td className="py-3 px-3">{formatCurrency(s.tax, currency)}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">{formatCurrency(s.total, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {reportType === 'TOP_MEDS' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Most Frequently Dispensed Medicines</h3>
            <div className="space-y-2">
              {topMedicines.map((m, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs border">
                  <span className="font-bold text-slate-900">#{i + 1} {m.name}</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded">{m.qty} Units Sold</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportType === 'PAYMENT' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Revenue Distribution by Payment Channel</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(paymentBreakdown).map(([pm, amt]) => (
                <div key={pm} className="p-4 bg-slate-50 rounded-xl border space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{pm}</span>
                  <div className="text-xl font-extrabold text-slate-900">{formatCurrency(amt, currency)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
