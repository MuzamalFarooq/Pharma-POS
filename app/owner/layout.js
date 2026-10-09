import { redirect } from 'next/navigation';
import ToastProvider from '@/components/providers/ToastProvider';
import OwnerShell from '@/components/owner/OwnerShell';
import { getPlatformOwnerSession } from '@/lib/platform-owner';

export const dynamic = 'force-dynamic';

export default async function OwnerLayout({ children }) {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  return (
    <>
      <ToastProvider />
      <OwnerShell user={session.user} hasPharmacyAccess={Boolean(session.activeOrganization)}>
        {children}
      </OwnerShell>
    </>
  );
}
