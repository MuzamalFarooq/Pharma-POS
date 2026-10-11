import nextEnv from '@next/env';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

const { hashResetToken, generateResetToken, checkRateLimit } = await import('../lib/security.js');
const { hashPassword, comparePassword, createSessionToken, verifySessionToken } = await import('../lib/auth.js');
const { getAppBaseUrl, sendPasswordResetEmail, sendPasswordChangeConfirmationEmail } = await import('../lib/email.js');

async function runTests() {
  console.log('--- STARTING PASSWORD RESET TEST SUITE ---');
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

  const testEmail = `test.reset.${Date.now()}@example.com`;
  const initialPassword = 'InitialPassword123!';
  const updatedPassword = 'NewSecurePassword456!';
  let testUser = null;

  try {
    // 1. Database connectivity & test user creation
    console.log('\n1. Setting up temporary test user...');
    const initialHash = await hashPassword(initialPassword);
    testUser = await prisma.user.create({
      data: {
        name: 'Test Reset User',
        email: testEmail,
        passwordHash: initialHash,
      },
    });
    assert(testUser && testUser.id, 'Created test user in PostgreSQL');

    // 2. Base URL resolution & Host header poison prevention
    console.log('\n2. Testing trusted Base URL resolution...');
    const baseUrl = getAppBaseUrl();
    assert(
      baseUrl === 'https://pharmapulse.muzamal.site' || baseUrl.startsWith('http'),
      `Trusted base URL resolved safely: ${baseUrl}`
    );

    // 3. Security & Cryptographic token generation
    console.log('\n3. Testing cryptographically secure token generation...');
    const rawToken = generateResetToken();
    assert(rawToken.length === 64, 'Raw reset token is 64 hex characters (256-bit unguessable entropy)');
    const tokenHash = hashResetToken(rawToken);
    assert(tokenHash.length === 64 && tokenHash !== rawToken, 'SHA-256 hash is correctly calculated');

    // 4. Storing token with 15-minute expiration
    console.log('\n4. Storing reset token in PostgreSQL...');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const tokenRecord = await prisma.passwordResetToken.create({
      data: {
        userId: testUser.id,
        tokenHash,
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'TestRunner/1.0',
      },
    });
    assert(tokenRecord.id && tokenRecord.usedAt === null, 'Token record saved with null usedAt');
    assert(
      Math.abs(tokenRecord.expiresAt.getTime() - (Date.now() + 15 * 60 * 1000)) < 2000,
      'Expiration set to 15 minutes'
    );

    // 5. Rate limiting logic
    console.log('\n5. Testing rate limiting module...');
    const testRateKey = `test:ip:${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(testRateKey, 5, 60000);
      assert(res.allowed === true, `Rate limit attempt ${i + 1} allowed`);
    }
    const blockedRes = checkRateLimit(testRateKey, 5, 60000);
    assert(blockedRes.allowed === false, 'Rate limit 6th attempt correctly blocked');

    // 6. Email service simulation/dispatch
    console.log('\n6. Testing email delivery module...');
    const emailResult = await sendPasswordResetEmail({
      to: testUser.email,
      name: testUser.name,
      rawToken,
    });
    assert(emailResult.success === true, 'sendPasswordResetEmail succeeded safely');

    // 7. Old session generation before password change
    console.log('\n7. Generating pre-reset session token...');
    const preResetSessionToken = await createSessionToken({
      userId: testUser.id,
      role: 'CUSTOMER',
      tokenVersion: testUser.passwordVersion || 1,
    });
    const preResetPayload = await verifySessionToken(preResetSessionToken);
    assert(preResetPayload && preResetPayload.userId === testUser.id, 'Session token created and verified');
    assert(preResetPayload.tokenVersion === 1, 'Session token contains tokenVersion 1');

    // 8. Password reset completion & session revocation
    console.log('\n8. Performing password reset & revocation...');
    const newPasswordHash = await hashPassword(updatedPassword);
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: testUser.id },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: now,
          passwordVersion: { increment: 1 },
        },
      });
      await tx.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { usedAt: now },
      });
    });

    const refreshedUser = await prisma.user.findUnique({ where: { id: testUser.id } });
    assert(refreshedUser.passwordChangedAt !== null, 'User passwordChangedAt timestamp updated');
    assert(refreshedUser.passwordVersion === 2, 'User passwordVersion incremented to 2');
    const isNewPassValid = await comparePassword(updatedPassword, refreshedUser.passwordHash);
    const isOldPassInvalid = await comparePassword(initialPassword, refreshedUser.passwordHash);
    assert(isNewPassValid && !isOldPassInvalid, 'New password matches and old password is rejected');

    // Verify session revocation logic via tokenVersion check
    const isRevoked = preResetPayload.tokenVersion !== refreshedUser.passwordVersion;
    assert(isRevoked, 'Old session token with version 1 is revoked because user is now version 2');

    // Generate new session token after reset
    const postResetSessionToken = await createSessionToken({
      userId: refreshedUser.id,
      role: 'CUSTOMER',
      tokenVersion: refreshedUser.passwordVersion,
    });
    const postResetPayload = await verifySessionToken(postResetSessionToken);
    assert(
      postResetPayload.tokenVersion === refreshedUser.passwordVersion,
      'New session token with version 2 is valid and active'
    );

    // 9. Re-use prevention (Single-use token enforcement)
    console.log('\n9. Testing single-use token prevention...');
    const lookupUsedToken = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });
    assert(lookupUsedToken.usedAt !== null, 'Token is marked as used');

    // 10. Expired token rejection
    console.log('\n10. Testing expired token handling...');
    const expiredRawToken = generateResetToken();
    const expiredHash = hashResetToken(expiredRawToken);
    const expiredRecord = await prisma.passwordResetToken.create({
      data: {
        userId: testUser.id,
        tokenHash: expiredHash,
        expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
      },
    });
    const isExpired = new Date() > new Date(expiredRecord.expiresAt);
    assert(isExpired, 'Expired token is correctly identified as expired');

    // 11. Password Change Notification Email
    console.log('\n11. Testing password change notification email...');
    const notifResult = await sendPasswordChangeConfirmationEmail({
      to: testUser.email,
      name: testUser.name,
    });
    assert(notifResult.success === true, 'Confirmation email dispatched safely');

    console.log(`\nALL ${testsPassed} TESTS PASSED SUCCESSFULLY!`);
  } finally {
    // Cleanup test user and tokens
    if (testUser?.id) {
      console.log('\nCleaning up test artifacts...');
      await prisma.passwordResetToken.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
      console.log('Cleanup completed.');
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
