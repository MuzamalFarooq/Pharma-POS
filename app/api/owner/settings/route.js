import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getPlatformOwnerSession } from '@/lib/platform-owner';
import { logPlatformAudit } from '@/lib/platform-audit';

const settingsSchema = z.object({
  platformName: z.string().trim().min(2).max(100),
  supportEmail: z.string().trim().email(),
  supportPhone: z.string().trim().max(50),
  commissionRate: z.coerce.number().min(0).max(50),
  maintenanceMode: z.boolean(),
  requireLicenseNumber: z.boolean(),
  orderCancellationGraceMinutes: z.coerce.number().int().min(0).max(120),
});

export async function GET() {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  try {
    const rawSettings = await prisma.platformSetting.findMany();
    const settingsMap = new Map(rawSettings.map((s) => [s.key, s.value]));

    const settings = {
      platformName: settingsMap.get('platformName') || 'PharmaPulse',
      supportEmail: settingsMap.get('supportEmail') || 'support@pharmapulse.com',
      supportPhone: settingsMap.get('supportPhone') || '+1 (555) 019-2834',
      commissionRate: parseFloat(settingsMap.get('commissionRate') || '2.5'),
      maintenanceMode: settingsMap.get('maintenanceMode') === 'true',
      requireLicenseNumber: settingsMap.get('requireLicenseNumber') !== 'false',
      orderCancellationGraceMinutes: parseInt(settingsMap.get('orderCancellationGraceMinutes') || '30', 10),
    };

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Fetch platform settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch platform settings.' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getPlatformOwnerSession();
  if (!session) {
    return NextResponse.json({ error: 'Platform owner access required.' }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
  }

  const validated = settingsSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Invalid settings payload.', details: validated.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = validated.data;

  try {
    // Upsert each setting
    const upserts = Object.entries(data).map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: {
          value: String(value),
          updatedBy: session.user.email,
        },
        create: {
          key,
          value: String(value),
          category: 'GENERAL',
          updatedBy: session.user.email,
        },
      })
    );

    await prisma.$transaction(upserts);

    await logPlatformAudit({
      action: 'PLATFORM_SETTINGS_UPDATED',
      actorEmail: session.user.email,
      actorName: session.user.name,
      entityType: 'SETTING',
      details: data,
    });

    return NextResponse.json({ success: true, message: 'Platform settings saved successfully.' });
  } catch (error) {
    console.error('Save platform settings error:', error);
    return NextResponse.json({ error: 'Failed to update platform settings.' }, { status: 500 });
  }
}
