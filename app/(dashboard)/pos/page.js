import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import POSClient from '@/components/pos/POSClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Pharmacy POS - PharmaPulse SaaS',
};

export default async function POSPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, branchId, organization, branch } = tenant;

  const medicines = await prisma.medicine.findMany({
    where: { organizationId, isActive: true },
    include: {
      category: { select: { name: true } },
      batches: {
        where: {
          organizationId,
          branchId: branchId || undefined,
          status: 'ACTIVE',
          quantity: { gt: 0 },
        },
        orderBy: { expiryDate: 'asc' },
      },
    },
  });

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  });

  return (
    <POSClient
      initialMedicines={medicines}
      initialCustomers={customers}
      organization={organization}
      branch={branch}
    />
  );
}
