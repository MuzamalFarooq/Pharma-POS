import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import ReportsClient from '@/components/reports/ReportsClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Reports & Analytics - PharmaPulse SaaS',
};

export default async function ReportsPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, branchId, organization } = tenant;

  const sales = await prisma.sale.findMany({
    where: { organizationId, branchId: branchId || undefined, status: 'COMPLETED' },
    include: { items: { include: { medicine: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const purchases = await prisma.purchase.findMany({
    where: { organizationId, branchId: branchId || undefined },
    include: { supplier: true },
  });

  const batches = await prisma.medicineBatch.findMany({
    where: { organizationId, branchId: branchId || undefined },
    include: { medicine: true },
  });

  return (
    <ReportsClient
      sales={sales}
      purchases={purchases}
      batches={batches}
      currency={organization?.currency || 'USD'}
      taxRate={organization?.taxRate || 0}
    />
  );
}
