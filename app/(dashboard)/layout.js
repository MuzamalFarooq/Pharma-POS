import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import DashboardShell from '@/components/layout/DashboardShell';
import ToastProvider from '@/components/providers/ToastProvider';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const session = await getSession();

  if (!session || !session.user || !session.activeOrganization) {
    redirect('/login');
  }

  return (
    <>
      <ToastProvider />
      <DashboardShell
        user={session.user}
        organization={session.activeOrganization}
        branch={session.activeBranch}
        role={session.role}
        branches={session.branches}
      >
        {children}
      </DashboardShell>
    </>
  );
}
