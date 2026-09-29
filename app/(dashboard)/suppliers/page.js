import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import SuppliersClient from '@/components/suppliers/SuppliersClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Suppliers Directory - PharmaPulse SaaS',
};

export default async function SuppliersPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const suppliers = await prisma.supplier.findMany({
    where: { organizationId },
    include: { _count: { select: { purchases: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return <SuppliersClient initialSuppliers={suppliers} />;
}
