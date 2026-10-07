import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, MapPin, Package2, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

export default async function CustomerMedicineDetailsPage({ params, searchParams }) {
  const { medicineId } = await params;
  const { branchId } = await searchParams;

  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    include: {
      category: { select: { name: true } },
      organization: {
        select: {
          id: true,
          name: true,
          currency: true,
          branches: {
            where: {
              status: 'ACTIVE',
              ...(branchId ? { id: branchId } : {}),
            },
            select: { id: true, name: true, code: true, city: true, address: true, isMain: true },
            orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      },
    },
  });

  if (!medicine || !medicine.isActive) notFound();
  const branch = medicine.organization.branches[0];
  if (!branch) notFound();

  const batches = await prisma.medicineBatch.findMany({
    where: {
      organizationId: medicine.organizationId,
      branchId: branch.id,
      medicineId: medicine.id,
      status: 'ACTIVE',
      expiryDate: { gt: new Date() },
      quantity: { gt: 0 },
    },
    select: { quantity: true, sellingPrice: true },
  });
  const availableStock = batches.reduce((sum, batch) => sum + batch.quantity, 0);
  const price = batches.length ? Math.min(...batches.map((batch) => Number(batch.sellingPrice))) : 0;
  const currency = medicine.organization.currency || 'USD';
  const storeHref = `/shop?branchId=${encodeURIComponent(branch.id)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href={storeHref} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to medicines
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr]">
          <div className="bg-gradient-to-br from-emerald-50 to-slate-100 p-8 flex items-center justify-center min-h-64">
            <div className="w-52 h-52 rounded-3xl bg-white shadow-inner border border-emerald-100 flex items-center justify-center">
              <Package2 className="w-20 h-20 text-emerald-600" />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[11px] tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Pharmacy medicine
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900">{medicine.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{medicine.genericName || medicine.brand || 'General medicine'}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className={`rounded-full text-xs font-bold px-2.5 py-1.5 ${availableStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {availableStock > 0 ? 'Available' : 'Out of stock'}
              </span>
              {medicine.category && <span className="rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1.5">{medicine.category.name}</span>}
            </div>

            <div className="mt-6 text-3xl font-black text-emerald-700">{formatCurrency(price, currency)}</div>
            <p className="mt-4 text-sm text-slate-600 leading-7">{medicine.description || 'Medicine stocked by the selected pharmacy branch.'}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              {medicine.brand && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Brand</span>{medicine.brand}</div>}
              {medicine.manufacturer && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Manufacturer</span>{medicine.manufacturer}</div>}
              {medicine.dosageForm && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Dosage form</span>{medicine.dosageForm}</div>}
              {medicine.strength && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Strength</span>{medicine.strength}</div>}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-bold text-slate-800 mb-2">Availability at this branch</div>
              <div>Units in stock: <span className="font-bold text-slate-900">{availableStock}</span></div>
              <div className="flex items-start gap-2 mt-3">
                <MapPin className="w-4 h-4 mt-0.5 text-emerald-600" />
                <span><strong className="text-slate-800">{medicine.organization.name} · {branch.name}</strong><br />{branch.address || branch.city || branch.code}</span>
              </div>
              {medicine.prescriptionRequired && <div className="mt-3 text-amber-700 font-semibold">Prescription may be required before dispensing.</div>}
            </div>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link href={storeHref} className="px-4 py-3 text-center rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50">
                Continue shopping
              </Link>
              <Link href="/customer" className="px-4 py-3 text-center rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700">
                View order history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
