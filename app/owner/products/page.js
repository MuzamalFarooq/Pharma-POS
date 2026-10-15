import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, BookOpen, Clock, Package, Pill, Search, ShieldAlert, SlidersHorizontal } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { formatCurrency, formatDateTime, calculateExpiryStatus } from '@/lib/utils';
import AdminHeader from '@/components/owner/AdminHeader';
import AdminPagination from '@/components/owner/AdminPagination';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Product & Inventory Oversight - PharmaPulse Administration' };

const PAGE_SIZE = 25;

export default async function ProductsPage({ searchParams }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const query = typeof params?.q === 'string' ? params.q.trim().slice(0, 100) : '';
  const pharmacyId = typeof params?.pharmacyId === 'string' ? params.pharmacyId : 'ALL';
  const stockFilter = typeof params?.stock === 'string' ? params.stock : 'ALL'; // ALL, LOW, OUT, IN
  const page = Math.max(1, parseInt(params?.page || '1', 10));

  const whereClause = {
    ...(pharmacyId !== 'ALL' ? { organizationId: pharmacyId } : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { genericName: { contains: query, mode: 'insensitive' } },
            { brand: { contains: query, mode: 'insensitive' } },
            { barcode: { contains: query, mode: 'insensitive' } },
            { sku: { contains: query, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [totalCount, pharmaciesList, medicines] = await Promise.all([
    prisma.medicine.count({ where: whereClause }),
    prisma.organization.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.medicine.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        organization: { select: { id: true, name: true, code: true, currency: true } },
        category: { select: { name: true } },
        batches: {
          select: {
            id: true,
            batchNumber: true,
            quantity: true,
            minStock: true,
            sellingPrice: true,
            expiryDate: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Product & Inventory Oversight"
        description="Inspect registered medicines, inventory stock levels, batch expiries, and pricing compliance across all pharmacies."
        icon={Pill}
        badge={`${totalCount} Medicines`}
        actions={
          <Link
            href="/owner/global-catalog"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
          >
            <BookOpen className="h-4 w-4" /> Global Medicine Catalog
          </Link>
        }
      />

      {/* Filter and Search Bar */}
      <form method="get" className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            name="q"
            defaultValue={query}
            placeholder="Search by medicine name, generic formula, brand, barcode, or SKU..."
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
        <button
          type="submit"
          className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
        >
          Filter
        </button>
        {(query || pharmacyId !== 'ALL') && (
          <Link
            href="/owner/products"
            className="flex items-center justify-center rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Reset
          </Link>
        )}
      </form>

      {/* Product Catalog Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-220 text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Product & Formulation</th>
                <th className="px-5 py-3.5">Pharmacy</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Total Quantity</th>
                <th className="px-5 py-3.5">Batches & Pricing</th>
                <th className="px-5 py-3.5">Expiry Status</th>
                <th className="px-5 py-3.5 text-right">Prescription Req.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {medicines.length > 0 ? (
                medicines.map((med) => {
                  const totalStock = med.batches.reduce((acc, b) => acc + (b.quantity || 0), 0);
                  const isOutOfStock = totalStock === 0;
                  const isLowStock = totalStock > 0 && med.batches.some((b) => b.quantity <= b.minStock);

                  // Find earliest expiry date
                  const activeBatches = med.batches.filter((b) => b.quantity > 0);
                  const earliestExpiry = activeBatches.length > 0
                    ? activeBatches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate))[0]
                    : null;
                  const expiryInfo = earliestExpiry ? calculateExpiryStatus(earliestExpiry.expiryDate) : null;

                  return (
                    <tr key={med.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-slate-900">{med.name}</p>
                        <p className="text-[11px] text-slate-500">
                          {[med.genericName, med.brand, med.dosageForm, med.strength].filter(Boolean).join(' · ')}
                        </p>
                        {(med.barcode || med.sku) && (
                          <p className="font-mono text-[9px] text-slate-400">
                            {med.barcode ? `Barcode: ${med.barcode}` : ''} {med.sku ? `SKU: ${med.sku}` : ''}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/owner/pharmacies/${med.organization.id}`}
                          className="font-semibold text-slate-900 hover:text-emerald-700"
                        >
                          {med.organization.name}
                        </Link>
                        <p className="font-mono text-[10px] text-slate-400">{med.organization.code}</p>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">
                        {med.category?.name || 'General'}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-extrabold ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-700'
                              : 'text-slate-900'
                          }`}
                        >
                          {totalStock} units
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {isOutOfStock ? 'Out of stock' : isLowStock ? 'Low stock alert' : 'Healthy stock'}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-slate-800">
                          {med.batches.length > 0 ? (
                            <span>
                              {formatCurrency(med.batches[0].sellingPrice, med.organization.currency)}
                              {med.batches.length > 1 ? ` (${med.batches.length} batches)` : ''}
                            </span>
                          ) : (
                            <span className="text-slate-400">No batches</span>
                          )}
                        </p>
                      </td>
                      <td className="px-5 py-3.5">
                        {expiryInfo ? (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              expiryInfo.status === 'EXPIRED'
                                ? 'bg-rose-100 text-rose-800'
                                : expiryInfo.status === 'CRITICAL'
                                ? 'bg-rose-50 text-rose-700'
                                : expiryInfo.status === 'WARNING'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {expiryInfo.label}
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {med.prescriptionRequired ? (
                          <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                            Prescription Rx
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">OTC</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-500">
                    No medicine catalog records found.
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
