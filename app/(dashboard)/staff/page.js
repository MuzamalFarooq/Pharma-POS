import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import StaffClient from '@/components/staff/StaffClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Staff Management - PharmaPulse SaaS',
};

export default async function StaffPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const members = await prisma.organizationMember.findMany({
    where: { organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      branch: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const branches = await prisma.branch.findMany({
    where: { organizationId, status: 'ACTIVE' },
    select: { id: true, name: true },
  });

  return <StaffClient initialMembers={members} branches={branches} userRole={tenant.role} currentUserId={tenant.userId} />;
}
