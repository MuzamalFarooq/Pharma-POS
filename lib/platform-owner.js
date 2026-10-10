import { getSession } from '@/lib/auth';

export function isPlatformOwnerEmail(email) {
  if (!email) return false;

  const configuredOwnerEmail = process.env.PHARMA_PLATFORM_OWNER_EMAIL?.trim().toLowerCase();
  const allowedEmails = (process.env.PHARMA_PLATFORM_OWNER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail === configuredOwnerEmail || allowedEmails.includes(normalizedEmail);
}

export async function getPlatformOwnerSession() {
  const session = await getSession();
  if (!session?.user || !isPlatformOwnerEmail(session.user.email)) return null;
  return session;
}
