import prisma from '@/lib/db';

export async function logPlatformAudit({
  action,
  actorEmail,
  actorName = 'Platform Owner',
  actorType = 'PLATFORM_OWNER',
  entityType,
  entityId = null,
  organizationId = null,
  details = null,
  ipAddress = null,
  userAgent = null,
  status = 'SUCCESS',
}) {
  try {
    if (!action || !actorEmail || !entityType) {
      console.warn('logPlatformAudit skipped due to missing required arguments', { action, actorEmail, entityType });
      return null;
    }

    const logEntry = await prisma.platformAuditLog.create({
      data: {
        action,
        actorType,
        actorEmail: actorEmail.toLowerCase().trim(),
        actorName,
        entityType,
        entityId: entityId ? String(entityId) : null,
        organizationId: organizationId ? String(organizationId) : null,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 100) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 255) : null,
        status,
      },
    });

    return logEntry;
  } catch (error) {
    console.error('Failed to write platform audit log:', error);
    return null;
  }
}
