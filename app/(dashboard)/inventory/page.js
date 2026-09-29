import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import InventoryClient from '@/components/inventory/InventoryClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Inventory & Batch Stock - PharmaPulse SaaS',
};

export default async function InventoryPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, branchId, organization } = tenant;

  const batches = await prisma.medicineBatch.findMany({
    where: {
      organizationId,
      branchId: branchId || undefined,
    },
    include: {
      medicine: { select: { name: true, genericName: true, category: { select: { name: true } } } },
      supplier: { select: { name: true } },
      branch: { select: { name: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });

  const medicines = await prisma.medicine.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true, strength: true },
  });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  return (
    <InventoryClient
      initialBatches={batches}
      medicines={medicines}
      suppliers={suppliers}
      currency={organization?.currency || 'USD'}
      userRole={tenant.role}
    />
  );
}
