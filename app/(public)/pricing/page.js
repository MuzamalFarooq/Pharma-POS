import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Pricing - PharmaPulse SaaS Pharmacy Management',
};

export default function PricingPage() {
  return (
    <div className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Flexible SaaS Pricing Plans</h1>
        <p className="text-slate-600 text-lg">
          No hidden fees. Choose a plan tailored to your pharmacy store or multi-branch chain.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Starter</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">14-Day Free Trial</h3>
              <p className="text-xs text-slate-500 mt-1">Full access for single pharmacy evaluation.</p>
            </div>
            <div className="text-4xl font-extrabold text-slate-900">$0</div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1 Pharmacy Branch</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 3 Staff Accounts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> POS & Barcode Checkout</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Expiry Tracking</li>
            </ul>
          </div>
          <Link href="/register" className="mt-8 block text-center py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50">
            Start Free Trial
          </Link>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-600 p-5 sm:p-8 flex flex-col justify-between shadow-xl relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">
            Recommended
          </div>
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Professional</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Pharmacy Pro</h3>
              <p className="text-xs text-slate-500 mt-1">For independent & multi-location pharmacies.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">$49</span>
              <span className="text-sm text-slate-500">/ month</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 3 Pharmacy Branches</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Staff Accounts</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Sales & Invoices</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Supplier Purchase Tracking</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full Audit Logs & RBAC</li>
            </ul>
          </div>
          <Link href="/register" className="mt-8 block text-center py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md">
            Subscribe Now
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-8 flex flex-col justify-between shadow-sm">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Pharmacy Chain</h3>
              <p className="text-xs text-slate-500 mt-1">For large chains with custom requirements.</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-slate-900">$129</span>
              <span className="text-sm text-slate-500">/ month</span>
            </div>
            <ul className="space-y-3 text-sm text-slate-600">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Branches</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Custom Roles & Permissions</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Priority 24/7 Support</li>
            </ul>
          </div>
          <Link href="/contact" className="mt-8 block text-center py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50">
            Contact Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
