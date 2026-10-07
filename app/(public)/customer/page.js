'use client';

import { useEffect, useState } from 'react';
import { Search, PackageCheck, Clock3, MapPin, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';

export default function CustomerOrdersPage() {
  const [form, setForm] = useState({ email: '', phone: '' });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadCustomerAccount = async () => {
      try {
        const sessionResponse = await fetch('/api/auth/me');
        if (!sessionResponse.ok) return;

        const sessionData = await sessionResponse.json();
        if (sessionData.role !== 'CUSTOMER') return;

        if (!cancelled) {
          setForm((current) => ({ ...current, email: sessionData.user.email }));
          setLoading(true);
        }

        const response = await fetch('/api/customer/orders');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Unable to load order history');
        }

        if (!cancelled) setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Unable to load order history');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadCustomerAccount();
    return () => {
      cancelled = true;
    };
  }, []);

  const searchOrders = async (e) => {
    e.preventDefault();
    if (!form.email && !form.phone) {
      setError('Please enter either a phone number or email address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (form.email) params.set('customerEmail', form.email);
      if (form.phone) params.set('customerPhone', form.phone);
      const res = await fetch(`/api/customer/orders?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to find orders');
      }
      setOrders(data.orders || []);
    } catch (err) {
      setError(err.message || 'Unable to load order history');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">My orders</h1>
        <p className="text-sm text-slate-500 mt-1">Track the status of your medicine orders and delivery updates.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 mb-6">
        <form onSubmit={searchOrders} className="grid grid-cols-1 md:grid-cols-[1.2fr_1.2fr_auto] gap-3 items-end">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="+1 555 000 0000"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700 disabled:opacity-50" disabled={loading}>
            {loading ? 'Checking...' : 'Find orders'}
          </button>
        </form>
        {error && <div className="mt-3 text-sm text-rose-600">{error}</div>}
      </div>

      {!orders.length ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">No medicine orders found for this customer yet.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Order #{order.id.slice(-6)}</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">{order.customerName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2.5 py-1.5 uppercase tracking-wide">
                    {order.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3 text-sm text-slate-600">
                <div className="flex items-start gap-2"><ShoppingBag className="w-4 h-4 mt-0.5 text-emerald-600" /> <span>{order.items.length} medicine item(s)</span></div>
                <div className="flex items-start gap-2"><PackageCheck className="w-4 h-4 mt-0.5 text-emerald-600" /> <span>{order.paymentMethod}</span></div>
                <div className="flex items-start gap-2"><Clock3 className="w-4 h-4 mt-0.5 text-emerald-600" /> <span>{order.branch?.name}</span></div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between border border-slate-100 rounded-xl p-3 text-sm">
                    <div>
                      <div className="font-bold text-slate-800">{item.medicine.name}</div>
                      <div className="text-slate-500">Qty: {item.quantity} · Unit: {formatCurrency(item.unitPrice, 'USD')}</div>
                    </div>
                    <div className="font-extrabold text-slate-900">{formatCurrency(item.total, 'USD')}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row justify-between gap-2 border-t border-slate-100 pt-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Delivery</div>
                  <div className="mt-1 flex items-start gap-1 text-sm text-slate-600"><MapPin className="w-4 h-4 text-slate-400" /> {order.deliveryAddress || 'Address not provided'}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</div>
                  <div className="text-2xl font-black text-emerald-700">{formatCurrency(order.total, 'USD')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
