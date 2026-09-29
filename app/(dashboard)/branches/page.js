import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import BranchesClient from '@/components/branches/BranchesClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Branch Locations - PharmaPulse SaaS',
};

export default async function BranchesPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const branches = await prisma.branch.findMany({
    where: { organizationId },
    include: { _count: { select: { members: true, sales: true, batches: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return <BranchesClient initialBranches={branches} userRole={tenant.role} />;
}
