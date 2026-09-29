import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import DashboardHeader from '@/components/layout/DashboardHeader';
import ToastProvider from '@/components/providers/ToastProvider';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session || !session.user || !session.activeOrganization) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-100/70 font-sans antialiased text-slate-900">
      <ToastProvider />

      {/* Sidebar */}
      <DashboardSidebar userRole={session.role} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader
          user={session.user}
          organization={session.activeOrganization}
          branch={session.activeBranch}
          role={session.role}
          branches={session.branches}
        />
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
