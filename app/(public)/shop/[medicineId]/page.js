import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ShieldCheck, Package2 } from 'lucide-react';
import prisma from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

export default async function CustomerMedicineDetailsPage({ params }) {
  const { medicineId } = await params;

  const medicine = await prisma.medicine.findUnique({
    where: { id: medicineId },
    include: {
      category: true,
      batches: {
        where: { status: 'ACTIVE', expiryDate: { gt: new Date() } },
        orderBy: { expiryDate: 'asc' },
      },
    },
  });

  if (!medicine || !medicine.isActive) {
    notFound();
  }

  const activeBatches = medicine.batches.filter((batch) => batch.quantity > 0);
  const availableStock = activeBatches.reduce((sum, batch) => sum + batch.quantity, 0);
  const price = activeBatches.length > 0 ? Math.min(...activeBatches.map((batch) => Number(batch.sellingPrice))) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-emerald-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to medicines
      </Link>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr]">
          <div className="bg-gradient-to-br from-emerald-50 to-slate-100 p-8 flex items-center justify-center">
            <div className="w-52 h-52 rounded-3xl bg-white shadow-inner border border-emerald-100 flex items-center justify-center">
              <Package2 className="w-20 h-20 text-emerald-600" />
            </div>
          </div>
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-emerald-600 font-bold uppercase text-[11px] tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" /> Available medicine
            </div>

            <h1 className="text-3xl font-extrabold text-slate-900">{medicine.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{medicine.genericName || medicine.brand || 'General medicine'}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1.5">
                {availableStock > 0 ? 'In stock' : 'Out of stock'}
              </span>
              {medicine.category && (
                <span className="rounded-full bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1.5">
                  {medicine.category.name}
                </span>
              )}
            </div>

            <div className="mt-6 text-3xl font-black text-emerald-700">{formatCurrency(price, 'USD')}</div>
            <p className="mt-4 text-sm text-slate-600 leading-7">{medicine.description || 'High-quality medicine stocked by the selected pharmacy and available for safe online ordering.'}</p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600">
              {medicine.brand && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Brand</span>{medicine.brand}</div>}
              {medicine.dosageForm && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Dosage Form</span>{medicine.dosageForm}</div>}
              {medicine.strength && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Strength</span>{medicine.strength}</div>}
              {medicine.manufacturer && <div className="rounded-xl bg-slate-50 p-3"><span className="font-semibold text-slate-800 block">Manufacturer</span>{medicine.manufacturer}</div>}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="font-bold text-slate-800 mb-2">Availability</div>
              <div>Units in stock: <span className="font-bold text-slate-900">{availableStock}</span></div>
              {medicine.prescriptionRequired && <div className="mt-2 text-amber-700 font-semibold">Prescription may be required before dispensing.</div>}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <Link href="/shop" className="px-4 py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50">
                Continue shopping
              </Link>
              <Link href="/customer" className="px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm shadow-md hover:bg-emerald-700">
                View order history
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
