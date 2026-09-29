export const metadata = {
  title: 'Terms of Service - PharmaPulse SaaS',
};

export default function TermsPage() {
  return (
    <div className="py-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
      <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4 text-sm text-slate-700">
        <h2 className="font-bold text-base text-slate-900">1. Acceptance of Terms</h2>
        <p>By registering a pharmacy organization on PharmaPulse SaaS, you agree to comply with healthcare regulatory standards and local pharmacy licensing laws.</p>
        <h2 className="font-bold text-base text-slate-900">2. Account Responsibility</h2>
        <p>Organization owners are responsible for assigning appropriate roles (Owner, Admin, Pharmacist, Cashier) to staff members and revoking access when employment terminates.</p>
      </div>
    </div>
  );
}
