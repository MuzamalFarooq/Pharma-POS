import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import SalesClient from '@/components/sales/SalesClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Sales History - PharmaPulse SaaS',
};

export default async function SalesPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, branchId, organization } = tenant;

  const sales = await prisma.sale.findMany({
    where: { organizationId, branchId: branchId || undefined },
    include: {
      customer: { select: { name: true, phone: true } },
      cashier: { select: { name: true } },
      branch: { select: { name: true } },
      items: { include: { medicine: { select: { name: true } }, batch: { select: { batchNumber: true } } } },
      invoices: { select: { invoiceNumber: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <SalesClient initialSales={sales} currency={organization?.currency || 'USD'} userRole={tenant.role} />;
}
