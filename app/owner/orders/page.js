import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowUpRight, Search, ShoppingBag, SlidersHorizontal } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminPagination from '@/components/owner/AdminPagination';
import AdminDateFilter from '@/components/owner/AdminDateFilter';
import { getDateRangeFilter } from '@/lib/date-utils';
import OrderStatusControls from '@/components/owner/OrderStatusControls';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Order Management - PharmaPulse Administration' };

const PAGE_SIZE = 20;
const statuses = ['ALL', 'PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default async function OrdersPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const statusParam = typeof params?.status === 'string' ? params.status.toUpperCase() : 'ALL';
  const status = statuses.includes(statusParam) ? statusParam : 'ALL';
  const pharmacyId = typeof params?.pharmacyId === 'string' ? params.pharmacyId : 'ALL';
  const range = typeof params?.range === 'string' ? params.range : 'all';
  const page = Math.max(1, parseInt(params?.page || '1', 10));
  const dateFilter = getDateRangeFilter(range);

  const whereClause = {
    ...(dateFilter ? { createdAt: dateFilter } : {}),
    ...(status !== 'ALL' ? { status } : {}),
    ...(pharmacyId !== 'ALL' ? { organizationId: pharmacyId } : {}),
    ...(query
      ? {
          OR: [
            { id: { contains: query, mode: 'insensitive' } },
            { customerName: { contains: query, mode: 'insensitive' } },
            { customerEmail: { contains: query, mode: 'insensitive' } },
            { customerPhone: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [totalCount, pharmaciesList, orders] = await Promise.all([
    prisma.customerOrder.count({ where: whereClause }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.customerOrder.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        organization: { select: { id: true, name: true, currency: true } },
        branch: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Cross-Platform Order Management"
        description="Monitor, inspect, and update customer orders across all enrolled pharmacies in real time."
        icon={ShoppingBag}
        badge={`${totalCount} Orders`}
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <form method="get" className="flex flex-1 flex-col gap-2.5 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Search orders</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              name="q"
              defaultValue={query}
              placeholder="Search by Order ID, customer name, email, or phone..."
              className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="sr-only">Pharmacy filter</span>
            <select
              name="pharmacyId"
              defaultValue={pharmacyId}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500 max-w-44"
            >
              <option value="ALL">All Pharmacies</option>
              {pharmaciesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold text-slate-600">
            <span className="sr-only">Status filter</span>
            <select
              name="status"
              defaultValue={status}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s === 'ALL' ? 'All Statuses' : s}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
          >
            Filter
          </button>
          {(query || status !== 'ALL' || pharmacyId !== 'ALL') && (
            <Link
              href="/owner/orders"
              className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Reset
            </Link>
          )}
        </form>
        <AdminDateFilter selected={range} />
      </div>

      {/* Orders Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Pharmacy / Branch</th>
                <th className="px-5 py-3.5">Customer Information</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Current Status</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/orders/${order.id}`}
                        className="font-mono font-bold text-slate-900 hover:text-emerald-700"
                      >
                        {order.id.slice(-8)}
                      </Link>
                      <p className="text-[10px] text-slate-400">{order.paymentMethod}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/owner/pharmacies/${order.organization.id}`}
                        className="font-semibold text-slate-900 hover:text-emerald-700"
                      >
                        {order.organization.name}
                      </Link>
                      <p className="text-[11px] text-slate-500">{order.branch.name}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">{order.customerPhone || order.customerEmail || '—'}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {order._count.items} items
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(order.total, order.organization.currency)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <OrderStatusControls orderId={order.id} currentStatus={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/owner/orders/${order.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900"
                      >
                        Details <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-500">
                    No customer orders found matching the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalCount}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
