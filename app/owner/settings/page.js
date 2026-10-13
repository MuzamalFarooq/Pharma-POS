import { redirect } from 'next/navigation';
import { Settings, ShieldCheck } from 'lucide-react';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import AdminHeader from '@/components/owner/AdminHeader';
import PlatformSettingsClient from '@/components/owner/PlatformSettingsClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Platform Settings - PharmaPulse Administration' };

export default async function SettingsPage() {
  const session = await getPlatformOwnerSession();
  if (!session) redirect('/login');

  const rawSettings = await prisma.platformSetting.findMany();
  const settingsMap = new Map(rawSettings.map((s) => [s.key, s.value]));

  const initialSettings = {
    platformName: settingsMap.get('platformName') || 'PharmaPulse',
    supportEmail: settingsMap.get('supportEmail') || 'support@pharmapulse.com',
    supportPhone: settingsMap.get('supportPhone') || '+1 (555) 019-2834',
    commissionRate: parseFloat(settingsMap.get('commissionRate') || '2.5'),
    maintenanceMode: settingsMap.get('maintenanceMode') === 'true',
    requireLicenseNumber: settingsMap.get('requireLicenseNumber') !== 'false',
    orderCancellationGraceMinutes: parseInt(settingsMap.get('orderCancellationGraceMinutes') || '30', 10),
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Platform Settings & Rules"
        description="Configure branding, global commission fee percentages, support contacts, and operational gates."
        icon={Settings}
      />

      <PlatformSettingsClient initialSettings={initialSettings} />
    </div>
  );
}
