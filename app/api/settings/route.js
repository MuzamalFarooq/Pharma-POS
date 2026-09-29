import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getTenantContext, logAuditEvent } from '@/lib/tenant';
import { settingsSchema } from '@/lib/validations';
import { PERMISSIONS } from '@/lib/rbac';

export async function PATCH(req) {
  try {
    const tenant = await getTenantContext(PERMISSIONS.SETTINGS_MANAGE);
    if (tenant.error) return NextResponse.json({ error: tenant.error }, { status: tenant.status });

    const body = await req.json();
    const validated = settingsSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Validation failed', details: validated.error.flatten().fieldErrors }, { status: 400 });
    }

    const { organizationId } = tenant;

    const updated = await prisma.organization.update({
      where: { id: organizationId },
      data: validated.data,
    });

    await logAuditEvent({
      organizationId,
      branchId: tenant.branchId,
      userId: tenant.userId,
      action: 'SETTINGS_UPDATED',
      entity: 'Organization',
      entityId: organizationId,
      metadata: validated.data,
    });

    return NextResponse.json({ success: true, organization: updated });
  } catch (error) {
    console.error('Settings PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
