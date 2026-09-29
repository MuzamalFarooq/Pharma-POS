import Link from 'next/link';
import { ShoppingCart, Package, Layers, Clock, Barcode, FileText, Users, Building, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Features - PharmaPulse SaaS Pharmacy Management',
};

export default function FeaturesPage() {
  const details = [
    {
      title: 'Pharmacy POS & Fast Billing',
      desc: 'Process sales instantly with hardware barcode scanners or medicine search. Calculates taxes, item discounts, subtotals, and prints formatted invoices.',
      icon: ShoppingCart,
    },
    {
      title: 'Batch & Expiry Date Management',
      desc: 'Separate medicine catalog entries from stock batch entries. Assign batch numbers, manufacturing dates, supplier IDs, purchase prices, and expiry dates.',
      icon: Layers,
    },
    {
      title: 'Stock Movements & Audit Trail',
      desc: 'Every purchase, sale, refund, and manual stock adjustment creates an immutable inventory transaction log tied to the staff member.',
      icon: Package,
    },
    {
      title: 'Supplier Purchase Management',
      desc: 'Record purchase orders from suppliers, receive goods, track unit cost prices, and automatically increment branch inventory.',
      icon: Building,
    },
    {
      title: 'Tenant-Scoped Financial Reports',
      desc: 'Detailed real-time reports on daily revenue, gross profit margins, low stock warnings, expiring inventory, and payment methods.',
      icon: TrendingUp,
    },
    {
      title: 'Role-Based Access Control (RBAC)',
      desc: 'Granular permissions for Owner, Admin, Manager, Pharmacist, Cashier, and Staff to safeguard sensitive business data.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Comprehensive Pharmacy Features</h1>
        <p className="text-slate-600 text-lg">
          Designed from the ground up for modern pharmacy operations, stock control, and compliance.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {details.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-8">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors shadow-md"
        >
          Explore All Features in Free Trial <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
