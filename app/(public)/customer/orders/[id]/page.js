import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, CheckCircle2, MapPin, PackageCheck, Phone } from 'lucide-react';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-sky-100 text-sky-700',
  PREPARING: 'bg-violet-100 text-violet-700',
  READY_FOR_DELIVERY: 'bg-cyan-100 text-cyan-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-rose-100 text-rose-700',
};

export default async function CustomerOrderDetailsPage({ params }) {
  const { id } = await params;
  const session = await getSession();
  if (!session?.user || session.role !== 'CUSTOMER') redirect('/login');

  const order = await prisma.customerOrder.findFirst({
    where: {
      id,
      customer: { is: { userId: session.user.id } },
    },
    include: {
      organization: { select: { name: true, currency: true } },
      branch: { select: { name: true, code: true, city: true, address: true } },
      items: {
        include: {
          medicine: { select: { name: true, genericName: true } },
        },
      },
    },
  });

  if (!order) notFound();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/customer" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to my orders
      </Link>

      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-700 px-5 py-7 sm:px-8 text-white">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">Order confirmation</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Thank you for your order</h1>
              <p className="text-sm text-emerald-50 mt-2">Order #{order.id.slice(-6)} · {formatDateTime(order.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-extrabold text-slate-900">{order.organization.name}</div>
              <div className="text-sm text-slate-500">{order.branch.name}{order.branch.city ? ` · ${order.branch.city}` : ''}</div>
            </div>
            <span className={`self-start rounded-full text-[11px] font-bold px-3 py-1.5 uppercase tracking-wide ${statusStyles[order.status] || 'bg-slate-100 text-slate-700'}`}>
              {order.status.replaceAll('_', ' ')}
            </span>
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Order items</h2>
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
                <div>
                  <div className="font-bold text-slate-900">{item.medicine.name}</div>
                  {item.medicine.genericName && <div className="text-xs text-slate-500">{item.medicine.genericName}</div>}
                  <div className="text-sm text-slate-600 mt-1">Qty: {item.quantity} · {formatCurrency(item.unitPrice, order.organization.currency)} each</div>
                </div>
                <div className="shrink-0 font-extrabold text-slate-900">{formatCurrency(item.total, order.organization.currency)}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800"><MapPin className="w-4 h-4 text-emerald-600" /> Delivery or pickup</div>
              <p className="text-sm text-slate-600 mt-2">{order.deliveryAddress || 'Pickup at the selected pharmacy'}</p>
              {order.customerPhone && <p className="flex items-center gap-2 text-sm text-slate-600 mt-2"><Phone className="w-4 h-4" />{order.customerPhone}</p>}
              <p className="text-xs text-slate-500 mt-2">{order.branch.address || order.branch.code}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <div className="flex items-center gap-2 font-bold text-slate-800"><PackageCheck className="w-4 h-4 text-emerald-600" /> Payment</div>
              <p className="text-sm text-slate-600 mt-2">{order.paymentMethod.replaceAll('_', ' ')}</p>
              <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-3 text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-semibold text-slate-800">{formatCurrency(order.subtotal, order.organization.currency)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-lg font-extrabold">
                <span>Total</span>
                <span className="text-emerald-700">{formatCurrency(order.total, order.organization.currency)}</span>
              </div>
            </div>
          </div>

          {order.notes && (
            <div className="rounded-xl border border-slate-200 p-4">
              <h2 className="text-sm font-bold text-slate-800">Your note</h2>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
          <Link href="/shop" className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700">
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
