import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Building2, Calendar, MapPin, Package, Phone, ShoppingBag, User } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import OrderStatusControls from '@/components/owner/OrderStatusControls';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({ params }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const { orderId } = await params;
  const order = await prisma.customerOrder.findUnique({
    where: { id: orderId },
    include: {
      organization: { select: { id: true, name: true, currency: true, phone: true, email: true } },
      branch: { select: { id: true, name: true, code: true, city: true, address: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true, genericName: true, brand: true, dosageForm: true } },
          batch: { select: { id: true, batchNumber: true, expiryDate: true } },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/owner/orders"
          className="mb-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to all orders
        </Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                Order #{order.id.slice(-8)}
              </h1>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-800">
                {order.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500 font-mono">
              Full UUID: {order.id} · Placed {formatDateTime(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Update Status:</span>
            <OrderStatusControls orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      {/* Top Details Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Customer Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <User className="h-4 w-4 text-emerald-600" /> Customer Information
          </h2>
          <div className="mt-3 space-y-1.5 text-xs text-slate-700">
            <p className="font-bold text-slate-900 text-sm">{order.customerName}</p>
            <p className="flex items-center gap-1.5 text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {order.customerPhone || 'No phone provided'}
            </p>
            {order.customerEmail && (
              <p className="text-slate-600">{order.customerEmail}</p>
            )}
            {order.deliveryAddress && (
              <p className="flex items-start gap-1.5 text-slate-600 pt-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>{order.deliveryAddress}</span>
              </p>
            )}
          </div>
        </div>

        {/* Pharmacy & Branch */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <Building2 className="h-4 w-4 text-emerald-600" /> Pharmacy Fulfillment
          </h2>
          <div className="mt-3 space-y-1.5 text-xs text-slate-700">
            <Link
              href={`/owner/pharmacies/${order.organization.id}`}
              className="font-bold text-slate-900 text-sm hover:text-emerald-700 block"
            >
              {order.organization.name}
            </Link>
            <p className="text-slate-600">Branch: {order.branch.name} ({order.branch.code})</p>
            <p className="text-slate-500">{order.organization.email} · {order.organization.phone}</p>
            <p className="text-slate-500">{order.branch.city || order.branch.address || 'Local branch'}</p>
          </div>
        </div>

        {/* Order Payment & Financial Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
            <ShoppingBag className="h-4 w-4 text-emerald-600" /> Payment & Total
          </h2>
          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Payment Method:</span>
              <strong className="text-slate-900">{order.paymentMethod}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.subtotal, order.organization.currency)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-slate-900">{formatCurrency(order.deliveryFee, order.organization.currency)}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2 text-sm">
              <span className="font-extrabold text-slate-900">Total Charged:</span>
              <span className="font-extrabold text-emerald-700">{formatCurrency(order.total, order.organization.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-extrabold text-slate-900">Ordered Medicine Items</h2>
          <p className="text-[10px] text-slate-500">Batch-tracked inventory allocations</p>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-5 py-3">Medicine</th>
              <th className="px-5 py-3">Batch Number</th>
              <th className="px-5 py-3">Batch Expiry</th>
              <th className="px-5 py-3">Unit Price</th>
              <th className="px-5 py-3">Quantity</th>
              <th className="px-5 py-3 text-right">Line Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {order.items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-900">{item.medicine.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {[item.medicine.genericName, item.medicine.brand, item.medicine.dosageForm].filter(Boolean).join(' · ')}
                  </p>
                </td>
                <td className="px-5 py-3.5 font-mono text-slate-800 font-semibold">{item.batch.batchNumber}</td>
                <td className="px-5 py-3.5 text-slate-500">{formatDateTime(item.batch.expiryDate)}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-900">{formatCurrency(item.unitPrice, order.organization.currency)}</td>
                <td className="px-5 py-3.5 font-extrabold text-slate-900">{item.quantity}</td>
                <td className="px-5 py-3.5 text-right font-extrabold text-slate-900">{formatCurrency(item.total, order.organization.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {order.notes && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Customer Delivery Instructions / Notes</h2>
          <p className="mt-2 text-xs text-slate-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
