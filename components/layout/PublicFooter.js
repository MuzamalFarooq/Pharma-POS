import Link from 'next/link';
import { Pill, Shield, Mail, Phone, MapPin } from 'lucide-react';

export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                <Pill className="w-5 h-5" />
              </div>
              <span className="font-bold text-xl text-white tracking-tight">PharmaPulse SaaS</span>
            </Link>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Complete multi-tenant pharmacy management SaaS platform. Manage inventory, high-speed point of sale, batches, expiry tracking, invoicing, suppliers, customers, and business analytics with enterprise security.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Shield className="w-4 h-4" /> HIPAA Compliant Architecture & Strict Tenant Data Isolation
            </div>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Pharmacy POS</Link></li>
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Batch & Expiry Control</Link></li>
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Inventory Management</Link></li>
              <li><Link href="/features" className="hover:text-emerald-400 transition-colors">Multi-Branch Operations</Link></li>
              <li><Link href="/pricing" className="hover:text-emerald-400 transition-colors">SaaS Pricing</Link></li>
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/about" className="hover:text-emerald-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-emerald-400 transition-colors">Contact Support</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>100 Technology Plaza, Suite 400, NY</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>+1 (800) 555-PHARMA</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>support@pharmapulse.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PharmaPulse SaaS. All rights reserved.</p>
          <p>Built with Next.js, Auth, Zod & Prisma Architecture.</p>
        </div>
      </div>
    </footer>
  );
}
