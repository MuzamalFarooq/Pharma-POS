export const metadata = {
  title: 'Privacy Policy - PharmaPulse SaaS',
};

export default function PrivacyPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
      <p className="text-sm text-slate-600 leading-relaxed">
        PharmaPulse SaaS is committed to maintaining strict data privacy, HIPAA compliance guidelines, and multi-tenant database isolation.
      </p>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm text-slate-700">
        <h2 className="font-bold text-base text-slate-900">1. Data Ownership & Tenant Isolation</h2>
        <p>All pharmacy data—including medicines, batches, inventory transactions, customer records, invoices, and sales history—is strictly owned by the registering pharmacy organization (Tenant). Data is never shared across tenants.</p>
        <h2 className="font-bold text-base text-slate-900">2. Security Controls</h2>
        <p>Passwords are stored using industry-standard bcrypt hashing. Sessions are protected via HTTP-only secure JWT tokens.</p>
      </div>
    </div>
  );
}
