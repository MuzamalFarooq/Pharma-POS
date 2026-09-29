import { getTenantContext } from '@/lib/tenant';
import SettingsClient from '@/components/settings/SettingsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Pharmacy Settings - PharmaPulse SaaS',
};

export default async function SettingsPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organization, user, role } = tenant;

  return <SettingsClient organization={organization} user={user} userRole={role} />;
}
