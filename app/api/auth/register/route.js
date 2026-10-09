import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { registerSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/tenant';

export async function POST(req) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      password,
      pharmacyName,
      phone,
      pharmacyEmail,
      address,
      city,
      state,
      country,
      postalCode,
      licenseNumber,
    } = validated.data;

    // Check existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Generate unique slug & code for Organization
    const baseSlug = pharmacyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    const codePrefix = pharmacyName
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 4)
      .toUpperCase() || 'PHAR';
    const code = `${codePrefix}${Math.floor(100 + Math.random() * 900)}`;

    const hashedPassword = await hashPassword(password);

    // Transaction to create User, Org, Main Branch, Owner Membership, and Default Category
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          name: fullName,
          email: email.toLowerCase().trim(),
          passwordHash: hashedPassword,
        },
      });

      // 2. Create Organization
      const organization = await tx.organization.create({
        data: {
          name: pharmacyName,
          slug,
          code,
          email: pharmacyEmail || email,
          phone,
          address,
          city,
          state: state || null,
          country: country || 'USA',
          postalCode: postalCode || null,
          licenseNumber: licenseNumber || null,
          invoicePrefix: `${codePrefix}-INV`,
          subscriptionPlan: 'FREE',
          subscriptionStatus: 'ACTIVE',
          status: 'PENDING',
        },
      });

      // 3. Create Default Branch
      const branch = await tx.branch.create({
        data: {
          organizationId: organization.id,
          name: `${pharmacyName} - Main Branch`,
          code: 'MAIN',
          phone,
          address,
          city,
          isMain: true,
        },
      });

      // 4. Create Owner Membership
      const member = await tx.organizationMember.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          role: 'OWNER',
          status: 'INVITED',
          branchId: branch.id,
        },
      });

      // 5. Create default medicine categories
      await tx.medicineCategory.createMany({
        data: [
          { organizationId: organization.id, name: 'General Medicines', description: 'Over the counter products' },
          { organizationId: organization.id, name: 'Antibiotics', description: 'Prescription antibiotics' },
          { organizationId: organization.id, name: 'Pain Relief', description: 'Analgesics & antipyretics' },
          { organizationId: organization.id, name: 'Vitamins & Supplements', description: 'Dietary supplements' },
        ],
      });

      return { user, organization, branch, member };
    });

    await logAuditEvent({
      organizationId: result.organization.id,
      branchId: result.branch.id,
      userId: result.user.id,
      action: 'ORGANIZATION_REGISTERED',
      entity: 'Organization',
      entityId: result.organization.id,
      metadata: { pharmacyName, code, ownerEmail: email },
    });

    return NextResponse.json({
      success: true,
      message: 'Registration submitted. Your pharmacy will be available after platform owner approval.',
      user: { id: result.user.id, name: result.user.name, email: result.user.email },
      organization: { id: result.organization.id, name: result.organization.name },
      redirect: '/login',
    }, { status: 201 });
  } catch (error) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
