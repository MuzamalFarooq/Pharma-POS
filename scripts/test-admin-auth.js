import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { loginSchema } from '../lib/validations.js';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS, hasPermission } from '../lib/rbac.js';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'pharmacy-pos-saas-secret-key-production-change-me-32chars!'
);

const prisma = new PrismaClient();

async function runTests() {
  console.log('🧪 Starting Admin Authentication & RBAC Verification Tests...\n');

  // Test 1: User Existence
  const user = await prisma.user.findUnique({
    where: { email: 'muzamalfarooq' },
    include: {
      memberships: {
        include: { organization: true, branch: true },
      },
    },
  });

  if (!user) {
    throw new Error('❌ TEST 1 FAILED: User "muzamalfarooq" not found in database.');
  }
  console.log('✅ TEST 1 PASSED: Admin user exists with ID:', user.id);

  // Test 2: Secure Password Hashing
  if (user.passwordHash === 'muzamal 123' || !user.passwordHash.startsWith('$2')) {
    throw new Error('❌ TEST 2 FAILED: Password is not properly bcrypt-hashed!');
  }
  console.log('✅ TEST 2 PASSED: Password is securely stored as bcrypt hash:', user.passwordHash.substring(0, 15) + '...');

  // Test 3: Password Verification
  const isMatch = await bcrypt.compare('muzamal 123', user.passwordHash);
  if (!isMatch) {
    throw new Error('❌ TEST 3 FAILED: bcrypt.compare failed for correct password.');
  }
  const isWrongMatch = await bcrypt.compare('wrongPassword', user.passwordHash);
  if (isWrongMatch) {
    throw new Error('❌ TEST 3 FAILED: bcrypt.compare returned true for wrong password!');
  }
  console.log('✅ TEST 3 PASSED: Password verification accurately validates correct and rejects incorrect credentials.');

  // Test 4: Role Assignment
  const activeMembership = user.memberships[0];
  if (!activeMembership || activeMembership.role !== 'ADMIN') {
    throw new Error(`❌ TEST 4 FAILED: Expected role ADMIN, got "${activeMembership?.role}"`);
  }
  console.log('✅ TEST 4 PASSED: Role is confirmed as ADMIN.');

  // Test 5: Multi-Tenant Scoping
  if (!activeMembership.organization || activeMembership.organization.slug !== 'pharmacy1') {
    throw new Error(`❌ TEST 5 FAILED: Admin account must be scoped to tenant pharmacy1.`);
  }
  console.log('✅ TEST 5 PASSED: Admin is strictly scoped to tenant organization:', activeMembership.organization.name);

  // Test 6: RBAC & Permission Verification
  const requiredPermissions = [
    PERMISSIONS.USERS_MANAGE,
    PERMISSIONS.BRANCHES_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUDIT_READ,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.INVENTORY_READ,
    PERMISSIONS.SALES_CREATE,
  ];

  for (const perm of requiredPermissions) {
    if (!hasPermission(activeMembership.role, perm)) {
      throw new Error(`❌ TEST 6 FAILED: ADMIN missing permission: ${perm}`);
    }
  }
  console.log('✅ TEST 6 PASSED: ADMIN role has all permissions including staff, audit, settings, and branches.');

  // Test 7: Login Validation Schema with username
  const validationResult = loginSchema.safeParse({
    email: 'muzamalfarooq',
    password: 'muzamal 123',
  });
  if (!validationResult.success) {
    throw new Error(`❌ TEST 7 FAILED: loginSchema rejected username "muzamalfarooq": ${JSON.stringify(validationResult.error)}`);
  }
  console.log('✅ TEST 7 PASSED: loginSchema successfully validates username "muzamalfarooq".');

  // Test 8: JWT Session Generation and Verification
  const token = await new SignJWT({
    userId: user.id,
    activeOrganizationId: activeMembership.organizationId,
    activeBranchId: activeMembership.branchId,
    role: activeMembership.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);

  const { payload } = await jwtVerify(token, JWT_SECRET);
  if (!payload || payload.userId !== user.id || payload.role !== 'ADMIN') {
    throw new Error('❌ TEST 8 FAILED: Session token payload does not match admin user.');
  }
  console.log('✅ TEST 8 PASSED: JWT session creation and verification functions as expected.');

  console.log('\n🎉 ALL 8 TESTS PASSED SUCCESSFULLY! The admin account is ready.');
}

runTests()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
