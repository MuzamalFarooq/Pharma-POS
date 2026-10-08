'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock3, Loader2, MapPin, PackageCheck, ShoppingBag } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import MedicineSections from '@/components/customer/MedicineSections';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  PREPARING: 'bg-violet-100 text-violet-700',
  READY_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function CustomerOrdersPage() {
  const [accountState, setAccountState] = useState('loading');
  const [customerName, setCustomerName] = useState('');
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async (nextPage, append = false) => {
    setLoadingOrders(true);
    setError('');
    try {
      const response = await fetch(`/api/customer/orders?page=${nextPage}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load your orders.');

      setOrders((current) => (append ? [...current, ...(data.orders || [])] : data.orders || []));
      setPage(nextPage);
      setHasMore(Boolean(data.pagination?.hasMore));
    } catch (err) {
      setError(err.message || 'Unable to load your orders.');
      if (!append) setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAccount = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (!cancelled) setAccountState('signed-out');
          return;
        }

        const account = await response.json();
        if (account.role !== 'CUSTOMER') {
          if (!cancelled) setAccountState('not-customer');
          return;
        }

        if (!cancelled) {
          setCustomerName(account.user.name);
          setAccountState('customer');
          await loadOrders(1);
        }
      } catch {
        if (!cancelled) {
          setAccountState('error');
          setError('Unable to verify your customer account. Please refresh and try again.');
        }
      }
    };

    loadAccount();
    return () => {
      cancelled = true;
    };
  }, [loadOrders]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900">My orders</h1>
        <p className="text-sm text-slate-500 mt-1">
          {customerName ? `Welcome, ${customerName}. ` : ''}Track your medicine orders and delivery updates.
        </p>
      </div>

      <div className="mb-8">
        <MedicineSections />
      </div>

      {accountState === 'loading' || (loadingOrders && orders.length === 0) ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 flex justify-center text-emerald-600">
          <Loader2 className="w-6 h-6 animate-spin" aria-label="Loading orders" />
        </div>
      ) : accountState === 'signed-out' || accountState === 'not-customer' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
          <ShoppingBag className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">Sign in to view your orders</h2>
          <p className="text-sm text-slate-500 mt-2">Order history is available only to the customer account that placed each order.</p>
          <div className="mt-5 flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/login" className="inline-flex justify-center items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">
              Sign in <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/customer/register" className="inline-flex justify-center items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Create a customer account
            </Link>
          </div>
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-6 text-center text-sm text-rose-700">
          {error}
          <button onClick={() => loadOrders(1)} className="block mx-auto mt-3 font-bold underline">Try again</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center text-slate-500">
          No medicine orders yet. <Link href="/shop" className="font-bold text-emerald-700 hover:underline">Browse the medicine store.</Link>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-600">Order #{order.id.slice(-6)}</div>
                    <div className="text-lg font-extrabold text-slate-900 mt-1">{order.organization.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{formatDateTime(order.createdAt)}</div>
                  </div>
                  <span className={`self-start sm:self-auto rounded-full text-[10px] font-bold px-2.5 py-1.5 uppercase tracking-wide ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>
                    {order.status.replaceAll('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                  <div className="flex items-start gap-2"><ShoppingBag className="w-4 h-4 mt-0.5 text-emerald-600" /><span>{order.items.length} medicine line(s)</span></div>
                  <div className="flex items-start gap-2"><PackageCheck className="w-4 h-4 mt-0.5 text-emerald-600" /><span>{order.paymentMethod.replaceAll('_', ' ')}</span></div>
                  <div className="flex items-start gap-2"><Clock3 className="w-4 h-4 mt-0.5 text-emerald-600" /><span>{order.branch.name}</span></div>
                </div>

                <div className="mt-4 space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl p-3 text-sm">
                      <div>
                        <div className="font-bold text-slate-800">{item.medicine.name}</div>
                        <div className="text-slate-500">Qty: {item.quantity} · {formatCurrency(item.unitPrice, order.organization.currency)}</div>
                      </div>
                      <div className="shrink-0 font-extrabold text-slate-900">{formatCurrency(item.total, order.organization.currency)}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 border-t border-slate-100 pt-4">
                  <div className="flex items-start gap-1 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 mt-0.5 text-slate-400" />
                    {order.deliveryAddress || 'Pickup at the selected pharmacy'}
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</div>
                      <div className="text-xl font-black text-emerald-700">{formatCurrency(order.total, order.organization.currency)}</div>
                    </div>
                    <Link href={`/customer/orders/${order.id}`} className="inline-flex items-center gap-1 text-sm font-bold text-emerald-700 hover:text-emerald-800">
                      Details <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {hasMore && (
            <button
              onClick={() => loadOrders(page + 1, true)}
              disabled={loadingOrders}
              className="mt-5 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {loadingOrders ? 'Loading...' : 'Load older orders'}
            </button>
          )}
        </>
      )}
    </div>
  );
}
