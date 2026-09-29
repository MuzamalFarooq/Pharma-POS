import { getTenantContext } from '@/lib/tenant';
import prisma from '@/lib/db';
import MedicinesClient from '@/components/medicines/MedicinesClient';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Medicines Catalog - PharmaPulse SaaS',
};

export default async function MedicinesPage() {
  const tenant = await getTenantContext();
  if (tenant.error) return null;
  const { organizationId } = tenant;

  const medicines = await prisma.medicine.findMany({
    where: { organizationId },
    include: {
      category: true,
      batches: {
        where: { organizationId },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const categories = await prisma.medicineCategory.findMany({
    where: { organizationId },
  });

  return <MedicinesClient initialMedicines={medicines} categories={categories} userRole={tenant.role} />;
}
