import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_IDENTIFIER = process.env.ADMIN_EMAIL || 'muzamalfarooq';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'muzamal 123';
const ADMIN_NAME = 'Muzamal Farooq';
const ADMIN_ROLE = 'ADMIN';

async function main() {
  console.log(`[Admin Setup] Initializing admin account setup for "${ADMIN_IDENTIFIER}"...`);

  // 1. Find or choose the target pharmacy organization for tenant isolation
  let organization = await prisma.organization.findFirst({
    where: {
      OR: [
        { slug: 'pharmacy1' },
        { name: { contains: 'pharmacy1', mode: 'insensitive' } },
        { code: 'PHAR472' },
      ],
    },
    include: { branches: true },
  });

  if (!organization) {
    // Fallback to first existing organization if pharmacy1 is not found
    organization = await prisma.organization.findFirst({
      include: { branches: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  if (!organization) {
    throw new Error('No organization found in database. Please register an organization first.');
  }

  console.log(`[Admin Setup] Target tenant organization: "${organization.name}" (${organization.id})`);

  // Determine main or default branch
  const mainBranch = organization.branches.find((b) => b.isMain) || organization.branches[0] || null;

  // 2. Hash the password using project's existing bcrypt implementation
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  // 3. Check if user with this identifier already exists (idempotency check)
  let user = await prisma.user.findUnique({
    where: {
      email: ADMIN_IDENTIFIER.toLowerCase().trim(),
    },
    include: { memberships: true },
  });

  if (user) {
    console.log(`[Admin Setup] Existing admin user account found with id: ${user.id} (${user.email})`);
    
    // Update password hash securely
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
      },
    });
    console.log(`[Admin Setup] Updated password hash for "${user.email}".`);
  } else {
    // Create new admin user
    user = await prisma.user.create({
      data: {
        name: ADMIN_NAME,
        email: ADMIN_IDENTIFIER.toLowerCase().trim(),
        passwordHash,
      },
      include: { memberships: true },
    });
    console.log(`[Admin Setup] Created new admin user with id: ${user.id} (${user.email}).`);
  }

  // 4. Configure OrganizationMember with ADMIN role within the tenant
  const existingMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },
  });

  if (existingMembership) {
    if (existingMembership.role !== ADMIN_ROLE || existingMembership.status !== 'ACTIVE') {
      await prisma.organizationMember.update({
        where: { id: existingMembership.id },
        data: {
          role: ADMIN_ROLE,
          status: 'ACTIVE',
          branchId: mainBranch?.id || existingMembership.branchId,
        },
      });
      console.log(`[Admin Setup] Updated membership role to "${ADMIN_ROLE}" (status: ACTIVE).`);
    } else {
      console.log(`[Admin Setup] Membership already configured as "${ADMIN_ROLE}" (status: ACTIVE).`);
    }
  } else {
    await prisma.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: ADMIN_ROLE,
        status: 'ACTIVE',
        branchId: mainBranch?.id || null,
      },
    });
    console.log(`[Admin Setup] Created new membership with role "${ADMIN_ROLE}" in "${organization.name}".`);
  }

  console.log('\n=============================================');
  console.log('✅ Admin Account Ready');
  console.log(`   Username/Email : ${ADMIN_IDENTIFIER}`);
  console.log(`   Assigned Role  : ${ADMIN_ROLE}`);
  console.log(`   Tenant Org     : ${organization.name}`);
  console.log(`   Store Branch   : ${mainBranch?.name || 'Main Branch'}`);
  console.log('=============================================\n');
}

main()
  .catch((e) => {
    console.error('[Admin Setup Error]', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
