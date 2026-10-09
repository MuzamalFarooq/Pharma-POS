import { getSession } from '@/lib/auth';

export function isPlatformOwnerEmail(email) {
  if (!email) return false;

  const allowedEmails = (process.env.PHARMA_PLATFORM_OWNER_EMAILS || '')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return allowedEmails.includes(email.trim().toLowerCase());
}

export async function getPlatformOwnerSession() {
  const session = await getSession();
  if (!session?.user || !isPlatformOwnerEmail(session.user.email)) return null;
  return session;
}
