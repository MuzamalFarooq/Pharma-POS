import { notFound } from 'next/navigation';
import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import OrdersClient from '@/components/orders/OrdersClient';
import { PERMISSIONS } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export default async function CustomerOrdersDashboardPage() {
  const tenant = await getTenantContext(PERMISSIONS.SALES_CREATE);
  if (tenant.error) notFound();

  const orders = await prisma.customerOrder.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      items: {
        include: {
          medicine: { select: { id: true, name: true } },
          batch: { select: { id: true, batchNumber: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <OrdersClient initialOrders={orders} currency={tenant.organization?.currency || 'USD'} />;
}
