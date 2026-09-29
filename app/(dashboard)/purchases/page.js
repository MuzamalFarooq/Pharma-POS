import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import PurchasesClient from '@/components/purchases/PurchasesClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Purchases & Supplier Orders - PharmaPulse SaaS',
};

export default async function PurchasesPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const purchases = await prisma.purchase.findMany({
    where: { organizationId },
    include: {
      supplier: true,
      branch: true,
      createdByUser: { select: { name: true } },
      items: { include: { medicine: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    select: { id: true, name: true },
  });

  const medicines = await prisma.medicine.findMany({
    where: { organizationId, isActive: true },
    select: { id: true, name: true, strength: true },
  });

  return (
    <PurchasesClient
      initialPurchases={purchases}
      suppliers={suppliers}
      medicines={medicines}
      currency={tenant.organization?.currency || 'USD'}
    />
  );
}
