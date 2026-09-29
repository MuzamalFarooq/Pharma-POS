import { getSession } from './auth';
import { hasPermission } from './rbac';
import prisma from './db';

export async function getTenantContext(requiredPermission = null) {
  const session = await getSession();

  if (!session || !session.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  if (!session.activeOrganization) {
    return { error: 'Organization context missing', status: 400 };
  }

  if (requiredPermission && !hasPermission(session.role, requiredPermission)) {
    return { error: 'Forbidden: Insufficient permissions', status: 403 };
  }

  return {
    user: session.user,
    organization: session.activeOrganization,
    branch: session.activeBranch,
    role: session.role,
    userId: session.user.id,
    organizationId: session.activeOrganization.id,
    branchId: session.activeBranch?.id || null,
    memberships: session.memberships,
    branches: session.branches,
  };
}

export function buildTenantWhere(whereClause = {}, organizationId) {
  if (!organizationId) {
    throw new Error('SECURITY VIOLATION: Attempted to query database without tenant scope organizationId');
  }
  return {
    ...whereClause,
    organizationId,
  };
}

export async function logAuditEvent({ organizationId, branchId, userId, action, entity, entityId, metadata }) {
  try {
    if (!organizationId || !userId || !action || !entity) return;
    await prisma.auditLog.create({
      data: {
        organizationId,
        branchId,
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    console.error('Failed to log audit event:', error);
  }
}
