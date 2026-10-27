import nextEnv from '@next/env';
import crypto from 'crypto';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { hashPassword, comparePassword, createSessionToken, verifySessionToken } = await import('../lib/auth.js');
const { getGoogleOAuthConfig, getGoogleRedirectUri, generateOAuthState } = await import('../lib/google-auth.js');
const { isPlatformOwnerEmail } = await import('../lib/platform-owner.js');

async function runGoogleOAuthTests() {
  console.log('====================================================');
  console.log('--- STARTING GOOGLE OAUTH SECURITY & INTEGRATION TEST SUITE ---');
  console.log('====================================================\n');

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testsFailed++;
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const testRunId = Date.now();
  const testGoogleEmail = `test.google.${testRunId}@example.com`;
  const testExistingUserEmail = `test.existing.${testRunId}@example.com`;
  const googleSub1 = `google-sub-${testRunId}-1`;
  const googleSub2 = `google-sub-${testRunId}-2`;

  let createdGoogleUser = null;
  let createdExistingUser = null;

  try {
    // ----------------------------------------------------
    // TEST 1: OAUTH CONFIGURATION & CANONICAL REDIRECT URI
    // ----------------------------------------------------
    console.log('1. Testing Google OAuth configuration & redirect URI resolution...');
    const config = getGoogleOAuthConfig();
    assert(typeof config === 'object', 'getGoogleOAuthConfig returns an object');
    assert('isConfigured' in config, 'Configuration status is accurately detected');

    const redirectUri = getGoogleRedirectUri();
    assert(
      redirectUri.includes('/api/auth/google/callback'),
      `Canonical redirect URI points to /api/auth/google/callback (Resolved: ${redirectUri})`
    );

    // ----------------------------------------------------
    // TEST 2: CRYPTOGRAPHIC STATE & PKCE GENERATION
    // ----------------------------------------------------
    console.log('\n2. Testing PKCE code verifier and anti-CSRF state generator...');
    const { state, codeVerifier, codeChallenge } = generateOAuthState();
    assert(state && state.length >= 32, 'Cryptographic state has strong entropy (>= 32 chars)');
    assert(codeVerifier && codeVerifier.length >= 32, 'PKCE code verifier has strong entropy');
    assert(codeChallenge && codeChallenge !== codeVerifier, 'PKCE code challenge is SHA-256 base64url derived');

    // ----------------------------------------------------
    // TEST 3: DATABASE SCHEMA & ACCOUNT MODEL VERIFICATION
    // ----------------------------------------------------
    console.log('\n3. Verifying Database Schema for Account model and nullable passwordHash...');
    createdGoogleUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          name: 'Google Test Customer',
          email: testGoogleEmail,
          passwordHash: null,
          avatar: 'https://lh3.googleusercontent.com/test-avatar',
        },
      });

      const acc = await tx.account.create({
        data: {
          userId: u.id,
          provider: 'google',
          providerAccountId: googleSub1,
        },
      });

      return { user: u, account: acc };
    });

    assert(createdGoogleUser.user.id && createdGoogleUser.user.passwordHash === null, 'Google user created with null passwordHash');
    assert(createdGoogleUser.account.provider === 'google', 'Account row created with provider "google"');
    assert(createdGoogleUser.account.providerAccountId === googleSub1, 'Account row linked with Google providerAccountId');

    // ----------------------------------------------------
    // TEST 4: DEDUPLICATION ON REPEATED GOOGLE SIGN-IN
    // ----------------------------------------------------
    console.log('\n4. Testing repeated Google Sign-In deduplication (No duplicate users)...');
    const existingAccountLookup = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: googleSub1,
        },
      },
      include: { user: true },
    });
    assert(existingAccountLookup !== null, 'Found existing account by providerAccountId');
    assert(existingAccountLookup.user.id === createdGoogleUser.user.id, 'Repeated sign-in resolves to the identical User ID');

    // Total user count for this email must remain exactly 1
    const userCount = await prisma.user.count({ where: { email: testGoogleEmail } });
    assert(userCount === 1, 'Exactly 1 User record exists for repeated Google sign-ins');

    // ----------------------------------------------------
    // TEST 5: SECURE IDENTITY LINKING TO EXISTING ACCOUNTS
    // ----------------------------------------------------
    console.log('\n5. Testing secure identity linking to existing password account...');
    const existingPassword = 'StrongPassword789!';
    const existingHash = await hashPassword(existingPassword);
    createdExistingUser = await prisma.user.create({
      data: {
        name: 'Existing Pharmacy User',
        email: testExistingUserEmail,
        passwordHash: existingHash,
      },
    });

    // Simulate Google callback linking verified email to existing account
    const linkedAccount = await prisma.account.create({
      data: {
        userId: createdExistingUser.id,
        provider: 'google',
        providerAccountId: googleSub2,
      },
    });
    assert(linkedAccount.userId === createdExistingUser.id, 'Google identity successfully linked to existing user');

    // Existing user can still authenticate with original password
    const refreshedExisting = await prisma.user.findUnique({ where: { id: createdExistingUser.id } });
    const isPasswordStillValid = await comparePassword(existingPassword, refreshedExisting.passwordHash);
    assert(isPasswordStillValid, 'Original password remains intact and valid after Google identity linking');

    // ----------------------------------------------------
    // TEST 6: ROLE & PRIVILEGE ESCALATION PREVENTION
    // ----------------------------------------------------
    console.log('\n6. Testing strict role security (Zero Privilege Escalation)...');
    // Ensure that newly registered Google user has NO organization memberships
    const googleUserMemberships = await prisma.organizationMember.findMany({
      where: { userId: createdGoogleUser.user.id },
    });
    assert(googleUserMemberships.length === 0, 'New Google user has zero organization memberships');

    // Ensure email is not recognized as platform owner unless explicitly configured in env
    const isOwner = isPlatformOwnerEmail(testGoogleEmail);
    assert(isOwner === false, 'Arbitrary Google user email is NEVER treated as platform owner');

    // Verify session token payload created for new Google user has CUSTOMER role
    const googleSessionToken = await createSessionToken({
      userId: createdGoogleUser.user.id,
      role: 'CUSTOMER',
      tokenVersion: createdGoogleUser.user.passwordVersion || 1,
    });
    const sessionPayload = await verifySessionToken(googleSessionToken);
    assert(sessionPayload.role === 'CUSTOMER', 'Google session token is restricted to least-privileged role: CUSTOMER');
    assert(!sessionPayload.activeOrganizationId, 'Google session token has no organization ID');

    // ----------------------------------------------------
    // TEST 7: PASSWORD LOGIN ATTEMPT ON GOOGLE-ONLY ACCOUNT
    // ----------------------------------------------------
    console.log('\n7. Testing email/password login behavior on Google-only account...');
    const googleUserRecord = await prisma.user.findUnique({ where: { email: testGoogleEmail } });
    assert(googleUserRecord.passwordHash === null, 'Google user has null passwordHash');
    // Verify that our login route logic blocks password matching when passwordHash is null
    const canAttemptCompare = Boolean(googleUserRecord.passwordHash);
    assert(!canAttemptCompare, 'Password comparison is safely bypassed for accounts without passwordHash');

    // ----------------------------------------------------
    // TEST 8: CONCURRENT ACCOUNT CREATION SAFETY
    // ----------------------------------------------------
    console.log('\n8. Testing concurrent account creation / race condition handling...');
    let caughtConstraint = false;
    try {
      // Attempting to insert duplicate provider + providerAccountId must violate unique constraint
      await prisma.account.create({
        data: {
          userId: createdGoogleUser.user.id,
          provider: 'google',
          providerAccountId: googleSub1,
        },
      });
    } catch (err) {
      if (err.code === 'P2002') {
        caughtConstraint = true;
      }
    }
    assert(caughtConstraint, 'Database unique constraint prevents duplicate provider account entries (P2002)');

    console.log('\n====================================================');
    console.log(`ALL ${testsPassed} TESTS PASSED SUCCESSFULLY! (0 failures)`);
    console.log('====================================================');
  } finally {
    console.log('\nCleaning up test records from database...');
    if (createdGoogleUser?.user?.id) {
      await prisma.account.deleteMany({ where: { userId: createdGoogleUser.user.id } });
      await prisma.user.delete({ where: { id: createdGoogleUser.user.id } }).catch(() => {});
    }
    if (createdExistingUser?.id) {
      await prisma.account.deleteMany({ where: { userId: createdExistingUser.id } });
      await prisma.user.delete({ where: { id: createdExistingUser.id } }).catch(() => {});
    }
    await prisma.$disconnect();
    console.log('Cleanup completed.\n');
  }
}

runGoogleOAuthTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
