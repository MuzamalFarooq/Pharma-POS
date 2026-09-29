import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import CustomersClient from '@/components/customers/CustomersClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Customers Directory - PharmaPulse SaaS',
};

export default async function CustomersPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, organization } = tenant;

  const customers = await prisma.customer.findMany({
    where: { organizationId },
    include: { _count: { select: { sales: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return <CustomersClient initialCustomers={customers} currency={organization?.currency || 'USD'} />;
}
