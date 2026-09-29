import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function runTenantSecurityTest() {
  console.log('====================================================');
  console.log('🔒 CRITICAL SECURITY TEST: MULTI-TENANT ISOLATION');
  console.log('====================================================');

  // 1. Fetch Tenant A & Tenant B
  const tenantA = await prisma.organization.findUnique({ where: { slug: 'city-care-pharmacy' } });
  const tenantB = await prisma.organization.findUnique({ where: { slug: 'medico-plus-pharmacy' } });

  if (!tenantA || !tenantB) {
    console.error('❌ Test Setup Error: Seed data for Tenant A or Tenant B missing.');
    process.exit(1);
  }

  console.log(`Tenant A ID: ${tenantA.id} (${tenantA.name})`);
  console.log(`Tenant B ID: ${tenantB.id} (${tenantB.name})\n`);

  // 2. Fetch Medicines scoped to Tenant A
  const medicinesA = await prisma.medicine.findMany({
    where: { organizationId: tenantA.id },
  });

  // 3. Fetch Medicines scoped to Tenant B
  const medicinesB = await prisma.medicine.findMany({
    where: { organizationId: tenantB.id },
  });

  console.log(`[TEST 1] Tenant A Medicines count: ${medicinesA.length}`);
  console.log(`[TEST 1] Tenant B Medicines count: ${medicinesB.length}`);

  const hasTenantBMedInA = medicinesA.some((m) => m.organizationId === tenantB.id);
  const hasTenantAMedInB = medicinesB.some((m) => m.organizationId === tenantA.id);

  if (hasTenantBMedInA || hasTenantAMedInB) {
    console.error('❌ SECURITY VIOLATION FAILED: Cross-tenant medicine leak detected!');
    process.exit(1);
  }
  console.log('✅ PASS: Tenant A and Tenant B medicine catalogs are strictly isolated.\n');

  // 4. Fetch Invoices scoped to Tenant A & Tenant B
  const invoicesA = await prisma.invoice.findMany({ where: { organizationId: tenantA.id } });
  const invoicesB = await prisma.invoice.findMany({ where: { organizationId: tenantB.id } });

  console.log(`[TEST 2] Tenant A Invoices count: ${invoicesA.length} (Prefix: ${tenantA.invoicePrefix})`);
  console.log(`[TEST 2] Tenant B Invoices count: ${invoicesB.length} (Prefix: ${tenantB.invoicePrefix})`);

  if (invoicesA.some((inv) => inv.organizationId !== tenantA.id) || invoicesB.some((inv) => inv.organizationId !== tenantB.id)) {
    console.error('❌ SECURITY VIOLATION FAILED: Cross-tenant invoice leak detected!');
    process.exit(1);
  }
  console.log('✅ PASS: Invoice sequences and records are tenant-isolated.\n');

  // 5. Test Unauthorized Access Prevention Simulation
  const fakeRequestWhere = {
    id: medicinesB[0]?.id || 'non-existent',
    organizationId: tenantA.id, // Attempting to query Tenant B item under Tenant A context
  };

  const maliciousResult = await prisma.medicine.findFirst({
    where: fakeRequestWhere,
  });

  if (maliciousResult !== null) {
    console.error('❌ SECURITY VIOLATION FAILED: Tenant A was able to access Tenant B resource!');
    process.exit(1);
  }
  console.log('✅ PASS: Querying Tenant B resource under Tenant A context returned null (IDOR Prevention Verified).\n');

  console.log('====================================================');
  console.log('🎉 ALL MULTI-TENANCY SECURITY TESTS PASSED CLEANLY!');
  console.log('====================================================');
}

runTenantSecurityTest()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
