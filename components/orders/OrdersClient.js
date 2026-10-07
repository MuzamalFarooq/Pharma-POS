'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Clock3, PackageCheck, Truck, XCircle, Search } from 'lucide-react';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { toast } from 'sonner';

const NEXT_STATUSES = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY_FOR_DELIVERY', 'CANCELLED'],
  READY_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  PREPARING: 'bg-violet-100 text-violet-700',
  READY_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default function OrdersClient({ initialOrders = [], currency = 'USD' }) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      const customerText = `${order.customerName} ${order.customerPhone || ''} ${order.customerEmail || ''}`.toLowerCase();
      return customerText.includes(q) || order.id.toLowerCase().includes(q);
    });
  }, [orders, search]);

  const updateOrderStatus = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/customer/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Status update failed');
      }
      setOrders((current) =>
        current.map((order) => (order.id === orderId ? { ...order, status: data.order.status } : order))
      );
      toast.success(`Order marked as ${status}`);
    } catch (error) {
      toast.error(error.message || 'Could not update order status');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Order Queue</h1>
          <p className="text-xs text-slate-500">Incoming online medicine orders for your pharmacy</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer or order ID"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No incoming online customer orders yet.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Order #{order.id.slice(-6)}</div>
                  <div className="text-lg font-extrabold text-slate-900 mt-1">{order.customerName}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusStyles[order.status]}`}>
                    {order.status}
                  </span>
                  <span className="text-xs text-slate-500">{formatDateTime(order.createdAt)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4 text-sm text-slate-600">
                <div>
                  <div className="font-bold text-slate-800 mb-1">Customer</div>
                  <div>{order.customerPhone || 'No phone'}</div>
                  <div>{order.customerEmail || 'No email'}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 mb-1">Delivery</div>
                  <div>{order.deliveryAddress || 'Address not provided'}</div>
                </div>
                <div>
                  <div className="font-bold text-slate-800 mb-1">Payment</div>
                  <div>{order.paymentMethod}</div>
                  <div className="font-extrabold text-emerald-700 mt-1">{formatCurrency(order.total, currency)}</div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-3 text-sm">
                    <div>
                      <div className="font-bold text-slate-800">{item.medicine.name}</div>
                      <div className="text-slate-500">Qty: {item.quantity} · Batch: {item.batch.batchNumber}</div>
                    </div>
                    <div className="font-extrabold text-slate-900">{formatCurrency(item.total, currency)}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock3 className="w-4 h-4 text-slate-400" />
                  {order.branch?.name || 'Selected branch'}
                </div>
                <div className="flex flex-wrap gap-2">
                  {[order.status, ...(NEXT_STATUSES[order.status] || [])].map((status) => (
                    <button
                      key={status}
                      disabled={updatingId === order.id || status === order.status}
                      onClick={() => updateOrderStatus(order.id, status)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide border transition ${
                        status === order.status
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                      } disabled:opacity-50`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
