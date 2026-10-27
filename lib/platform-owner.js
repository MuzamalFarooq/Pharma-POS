import { verifySessionToken } from './auth.js';

export function getPlatformOwnerConfig() {
  const configuredOwnerEmail = (process.env.PHARMA_PLATFORM_OWNER_EMAIL || '')
    .trim()
    .toLowerCase();
  const allowedEmails = (process.env.PHARMA_PLATFORM_OWNER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const knownEmails = Array.from(new Set([configuredOwnerEmail, ...allowedEmails].filter(Boolean)));
  const resolvedEmail = configuredOwnerEmail || (knownEmails.length === 1 ? knownEmails[0] : '');

  return {
    email: resolvedEmail,
    emails: knownEmails,
    name: (process.env.PHARMA_PLATFORM_OWNER_NAME || 'Platform Owner').trim() || 'Platform Owner',
    password: process.env.PHARMA_PLATFORM_OWNER_PASSWORD || '',
    allowedEmails,
  };
}

export function isPlatformOwnerEmail(email) {
  if (!email) return false;

  const normalizedEmail = email.trim().toLowerCase();
  const { emails } = getPlatformOwnerConfig();
  return emails.includes(normalizedEmail);
}

export function verifyPlatformOwnerCredentials(email, password) {
  if (typeof email !== 'string' || typeof password !== 'string') {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const { emails, password: configuredPassword } = getPlatformOwnerConfig();

  if (emails.length === 0) {
    throw new Error('Platform owner authentication is not configured. Set PHARMA_PLATFORM_OWNER_EMAIL and PHARMA_PLATFORM_OWNER_PASSWORD in the server environment.');
  }

  if (!configuredPassword) {
    throw new Error('Platform owner authentication is not configured. Set PHARMA_PLATFORM_OWNER_PASSWORD in the server environment.');
  }

  if (!emails.includes(normalizedEmail)) {
    return false;
  }

  const expectedPassword = Buffer.from(configuredPassword, 'utf8');
  const submittedPassword = Buffer.from(password, 'utf8');

  if (expectedPassword.length !== submittedPassword.length) {
    return false;
  }

  try {
    return require('node:crypto').timingSafeEqual(expectedPassword, submittedPassword);
  } catch {
    return expectedPassword.toString('utf8') === submittedPassword.toString('utf8');
  }
}

export async function getPlatformOwnerSession() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const token = cookieStore.get('pharma_pos_session')?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload || !payload.userId || payload.role !== 'PLATFORM_OWNER' || payload.platformOwner !== true) {
    return null;
  }

  const { email, emails } = getPlatformOwnerConfig();
  const sessionEmail = (payload.userId && payload.userId.startsWith('platform-owner:'))
    ? payload.userId.slice('platform-owner:'.length)
    : (email || emails[0] || payload.email || '');
  if (!sessionEmail) return null;

  const user = {
    id: payload.userId,
    name: payload.name || 'Platform Owner',
    email: sessionEmail,
    avatar: null,
    passwordChangedAt: null,
    passwordVersion: 1,
  };

  return {
    user,
    activeOrganization: null,
    activeBranch: null,
    role: 'PLATFORM_OWNER',
    memberships: [],
    branches: [],
  };
}
