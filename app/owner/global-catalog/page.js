import { redirect } from 'next/navigation';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import GlobalCatalogClient from '@/components/owner/GlobalCatalogClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Global Medicine Catalog - PharmaPulse Administration',
  description: 'Manage master pharmaceutical catalog items, standard formulations, and MSRP pricing.',
};

export default async function GlobalCatalogPage() {
  const session = await getPlatformOwnerSession();
  if (!session) {
    redirect('/login');
  }

  return <GlobalCatalogClient />;
}
