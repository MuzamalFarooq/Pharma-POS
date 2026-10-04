import Link from 'next/link';
import {
  Pill,
  ShoppingCart,
  Package,
  Layers,
  Clock,
  Barcode,
  FileText,
  Users,
  Building,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Building2,
  Sparkles,
  Search,
} from 'lucide-react';

export const metadata = {
  title: 'PharmaPulse SaaS - Multi-Tenant Pharmacy Management Platform',
  description: 'Manage pharmacy inventory, high-speed POS, batches, expiry dates, invoices, staff, and multi-branch operations from one secure cloud dashboard.',
};

export default function LandingPage() {
  const features = [
    {
      icon: ShoppingCart,
      title: 'High-Speed Pharmacy POS',
      desc: 'Process customer sales quickly with barcode scanning, auto stock deduction, discounts, tax calculation, and instant invoices.',
    },
    {
      icon: Package,
      title: 'Medicine Inventory & SKU',
      desc: 'Manage complete product catalogs separated from batch inventory, strength, generic names, and dosage forms.',
    },
    {
      icon: Layers,
      title: 'Multi-Batch Tracking',
      desc: 'Track multiple batches per medicine with distinct purchase prices, selling prices, suppliers, and expiry dates.',
    },
    {
      icon: Clock,
      title: 'Expiry Date Controls',
      desc: 'Automated 30/60/90-day expiry alerts to prevent selling expired stock and reduce pharmacy shrinkage.',
    },
    {
      icon: Barcode,
      title: 'Barcode & SKU Scanning',
      desc: 'Full support for hardware barcode scanners and manual SKU lookup for ultra-fast checkout.',
    },
    {
      icon: FileText,
      title: 'Tenant-Aware Invoices',
      desc: 'Generate branded PDF-ready thermal receipts and tax invoices with customizable pharmacy logos and sequences.',
    },
    {
      icon: Users,
      title: 'Customer & Credit Ledger',
      desc: 'Track customer purchase histories, contact details, total spending, and credit balances.',
    },
    {
      icon: Building,
      title: 'Supplier & Purchase Orders',
      desc: 'Create supplier purchase orders, track received shipments, and automatically update inventory stock.',
    },
    {
      icon: TrendingUp,
      title: 'Real-Time Reports & Analytics',
      desc: 'Daily, weekly, and monthly sales reports, profit margins, top-selling medicines, and tax summaries.',
    },
    {
      icon: ShieldCheck,
      title: 'Multi-Tenant Security & RBAC',
      desc: 'Strict organization data isolation, role-based access for Owner, Pharmacist, Cashier, and Manager staff.',
    },
    {
      icon: Building2,
      title: 'Multi-Branch Support',
      desc: 'Manage multiple pharmacy store locations under one subscription with branch-aware inventory.',
    },
    {
      icon: Sparkles,
      title: 'Audit & Accountability',
      desc: 'Track every inventory change, sale, refund, and staff login with a detailed audit trail.',
    },
  ];

  return (
    <div className="space-y-24 pb-20">
      {/* HERO SECTION */}
      <section className="relative pt-12 lg:pt-20 overflow-hidden bg-linear-to-b from-emerald-50/50 via-white to-slate-50 border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Enterprise Multi-Tenant Pharmacy SaaS
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Complete Pharmacy Management, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                All in One Cloud Platform
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Empower your pharmacy with automated stock tracking, batch expiry alerts, high-speed POS checkout, invoice generation, supplier management, and real-time business reports.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 group"
              >
                Start Free Trial <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base shadow-sm transition-all text-center"
              >
                Sign In to Dashboard
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 text-xs font-semibold text-slate-500 pt-4">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Instant Setup</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> No Credit Card Required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Isolated Tenant DB</span>
            </div>
          </div>

          {/* DASHBOARD PREVIEW MOCKUP */}
          <div className="mt-8 sm:mt-16 max-w-5xl mx-auto rounded-2xl border border-slate-300/80 bg-white p-2 sm:p-3 shadow-2xl shadow-slate-900/10 w-full overflow-hidden">
            <div className="rounded-xl border border-slate-200 bg-slate-900 text-white p-3.5 sm:p-6 overflow-hidden space-y-4 sm:space-y-6">
              {/* Mock Topbar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 sm:pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[11px] sm:text-xs font-mono text-slate-400 truncate max-w-[200px] sm:max-w-none">
                    app.pharmapulse.com/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium truncate max-w-[220px]">
                    Tenant: City Care (Active)
                  </span>
                </div>
              </div>

              {/* Mock Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-lg border border-slate-700/60">
                  <span className="text-xs text-slate-400 font-medium">Today's Revenue</span>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1">$2,840.50</div>
                  <span className="text-[10px] text-emerald-500 font-semibold">+14% vs yesterday</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-lg border border-slate-700/60">
                  <span className="text-xs text-slate-400 font-medium">Total Sales (POS)</span>
                  <div className="text-xl sm:text-2xl font-bold text-white mt-1">142 Invoices</div>
                  <span className="text-[10px] text-slate-400">Main Branch</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-lg border border-slate-700/60">
                  <span className="text-xs text-slate-400 font-medium">Low Stock Alerts</span>
                  <div className="text-xl sm:text-2xl font-bold text-amber-400 mt-1">4 Medicines</div>
                  <span className="text-[10px] text-amber-500">Reorder threshold</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 sm:p-4 rounded-lg border border-slate-700/60">
                  <span className="text-xs text-slate-400 font-medium">Expiring Soon (30d)</span>
                  <div className="text-xl sm:text-2xl font-bold text-rose-400 mt-1">2 Batches</div>
                  <span className="text-[10px] text-rose-400 font-semibold">Action required</span>
                </div>
              </div>

              {/* Mock POS Preview */}
              <div className="bg-slate-800/50 p-3 sm:p-4 rounded-xl border border-slate-700/60 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-3 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">Live POS Quick Checkout</span>
                    <span className="text-[11px] sm:text-xs text-slate-400">Barcode Ready</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-2.5 flex items-center gap-2 text-xs text-slate-400 min-w-0">
                    <Search className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Search medicine by name or barcode (e.g. Amoxicillin, Panadol)...</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-900/80 border border-slate-700 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 truncate">Amoxicillin 500mg Caps (Batch B2026-01)</div>
                        <div className="text-[11px] text-slate-400 truncate">Exp: Aug 2027 • Stock: 150 caps</div>
                      </div>
                      <div className="text-emerald-400 font-bold shrink-0">$24.50</div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 rounded-lg border border-slate-700 space-y-3 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-300">Cart Total</span>
                    <div className="text-xl sm:text-2xl font-bold text-white mt-1">$31.50</div>
                    <div className="text-[10px] text-slate-400">Includes 5% Tax</div>
                  </div>
                  <div className="py-2 px-2 bg-emerald-600 rounded text-center font-bold text-[11px] sm:text-xs text-white truncate">
                    Complete & Print Invoice
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Built For Modern Pharmacies</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">Everything You Need To Run Your Pharmacy Business</p>
          <p className="text-slate-600 text-base">
            Designed specifically for independent pharmacies, retail medicine chains, and clinic dispensaries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all space-y-3 group"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Simple Onboarding</h2>
            <p className="text-3xl font-extrabold">Get Started in 3 Easy Steps</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto font-bold text-lg">
                1
              </div>
              <h3 className="text-xl font-bold">Register Your Pharmacy</h3>
              <p className="text-sm text-slate-300">
                Create your pharmacy organization, owner credentials, and default store branch in seconds.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto font-bold text-lg">
                2
              </div>
              <h3 className="text-xl font-bold">Add Medicines & Staff</h3>
              <p className="text-sm text-slate-300">
                Add your medicine catalog, stock batches with expiry dates, and invite pharmacists & cashiers.
              </p>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto font-bold text-lg">
                3
              </div>
              <h3 className="text-xl font-bold">Start Selling & Managing</h3>
              <p className="text-sm text-slate-300">
                Launch the POS for instant sales, print invoices, monitor live stock levels, and review analytics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING ARCHITECTURE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Simple & Transparent</h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-slate-900">SaaS Subscription Plans</p>
          <p className="text-slate-600 text-base">Scale seamlessly as your pharmacy grows. Stripe-ready subscription model.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Plan 1: Free Trial */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Free Trial</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Starter</h3>
                <p className="text-xs text-slate-500 mt-1">Ideal for newly launched single pharmacies.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-sm text-slate-500">/ 14 days</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 1 Pharmacy Branch</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 3 Staff Accounts</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Full POS & Invoicing</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Batch Expiry Control</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Standard Reports</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              Start Free Trial
            </Link>
          </div>

          {/* Plan 2: Professional */}
          <div className="bg-white rounded-2xl border-2 border-emerald-600 p-8 flex flex-col justify-between shadow-xl relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </div>
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Professional Plan</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Pharmacy Pro</h3>
                <p className="text-xs text-slate-500 mt-1">For growing pharmacies seeking full operational power.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$49</span>
                <span className="text-sm text-slate-500">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Up to 3 Pharmacy Branches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Staff Members</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited POS & Barcode Sales</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Purchase Orders & Suppliers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Advanced Analytics & Tax Reports</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Audit Log & Role RBAC</li>
              </ul>
            </div>
            <Link
              href="/register"
              className="mt-8 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-sm text-white shadow-md shadow-emerald-600/25 transition-all text-center"
            >
              Get Started Now
            </Link>
          </div>

          {/* Plan 3: Business */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enterprise Plan</span>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">Pharmacy Chain</h3>
                <p className="text-xs text-slate-500 mt-1">For multi-location pharmacy chains and hospital networks.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-900">$129</span>
                <span className="text-sm text-slate-500">/ month</span>
              </div>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Pharmacy Branches</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Unlimited Staff & Custom Roles</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Dedicated Cloud Infrastructure</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> API Access & Webhooks</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /> 24/7 Priority Support</li>
              </ul>
            </div>
            <Link
              href="/contact"
              className="mt-8 w-full py-3 rounded-xl border border-slate-300 font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors text-center"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-100/70 border border-slate-200 rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">[Placeholder Content]</span>
            <h2 className="text-2xl font-bold text-slate-900">Trusted by Pharmacists Nationwide</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <p className="text-sm text-slate-600 italic">
                "PharmaPulse eliminated our expiry waste completely. The batch tracking alerts us weeks before medicines expire so we can discount or return them to suppliers."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                  SJ
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Dr. Sarah Jenkins</div>
                  <div className="text-[11px] text-slate-500">Chief Owner, City Care Pharmacy</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
              <p className="text-sm text-slate-600 italic">
                "The POS checkout is lightning fast. Our cashiers scan barcodes and generate printed tax invoices in less than 5 seconds per customer."
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold flex items-center justify-center text-xs">
                  MC
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Dr. Michael Chang</div>
                  <div className="text-[11px] text-slate-500">Managing Director, Medico Plus Pharmacy</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 sm:p-12 text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-4xl font-extrabold">Ready to Modernize Your Pharmacy Operations?</h2>
          <p className="text-emerald-100 text-base max-w-2xl mx-auto">
            Join hundreds of pharmacies operating seamlessly with PharmaPulse SaaS. Register today and get instant access to your dedicated dashboard.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white text-emerald-800 font-bold text-base hover:bg-emerald-50 transition-colors shadow-lg"
            >
              Get Started Free <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
