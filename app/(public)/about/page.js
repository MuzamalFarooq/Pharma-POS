import { Pill, Shield, Users, Award } from 'lucide-react';

export const metadata = {
  title: 'About - PharmaPulse SaaS',
};

export default function AboutPage() {
  return (
    <div className="py-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-slate-900">About PharmaPulse SaaS</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          We build enterprise cloud solutions designed specifically for independent pharmacies, retail store chains, and clinical dispensaries.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Tenant Isolation</h3>
          <p className="text-sm text-slate-600">Strict database segregation ensures no pharmacy's sales or customer data is ever accessible to another tenant.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Multi-Role Support</h3>
          <p className="text-sm text-slate-600">Empower owners, managers, pharmacists, and cashiers with tailored user permissions.</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900">Compliance & Audit</h3>
          <p className="text-sm text-slate-600">Comprehensive audit logging for inventory changes, sales, and administrative updates.</p>
        </div>
      </div>
    </div>
  );
}
