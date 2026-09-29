import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import InvoicesClient from '@/components/invoices/InvoicesClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Invoices Generator - PharmaPulse SaaS',
};

export default async function InvoicesPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId, branchId, organization, branch } = tenant;

  const invoices = await prisma.invoice.findMany({
    where: { organizationId, branchId: branchId || undefined },
    include: {
      customer: { select: { name: true, phone: true } },
      sale: {
        include: {
          cashier: { select: { name: true } },
          items: { include: { medicine: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return <InvoicesClient initialInvoices={invoices} organization={organization} branch={branch} />;
}
