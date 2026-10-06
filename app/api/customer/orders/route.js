import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';

const customerOrderItemSchema = z.object({
  medicineId: z.string().min(1),
  batchId: z.string().min(1),
  quantity: z.number().int().positive().max(999),
});

const createOrderSchema = z.object({
  branchId: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().trim().optional().or(z.literal('')).transform((value) => value?.trim() || null),
  customerEmail: z.string().trim().optional().or(z.literal('')).transform((value) => value?.trim() || null),
  deliveryAddress: z.string().trim().optional().or(z.literal('')).transform((value) => value?.trim() || null),
  notes: z.string().trim().optional().or(z.literal('')).transform((value) => value?.trim() || null),
  paymentMethod: z.string().optional().default('CASH_ON_DELIVERY'),
  items: z.array(customerOrderItemSchema).min(1),
});

const normalizeContactDetail = (value) => {
  if (!value) return null;
  return value.trim().toLowerCase();
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = normalizeContactDetail(searchParams.get('customerEmail'));
    const customerPhone = normalizeContactDetail(searchParams.get('customerPhone'));

    if (!customerEmail && !customerPhone) {
      return NextResponse.json({ error: 'Please provide an email or phone number.' }, { status: 400 });
    }

    const filters = [];

    if (customerEmail) {
      filters.push({ customerEmail: { equals: customerEmail, mode: 'insensitive' } });
    }

    if (customerPhone) {
      filters.push({ customerPhone: { equals: customerPhone, mode: 'insensitive' } });
    }

    const orders = await prisma.customerOrder.findMany({
      where: filters.length ? { OR: filters } : {},
      include: {
        branch: { select: { id: true, name: true, code: true, city: true, address: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true, genericName: true } },
            batch: { select: { id: true, batchNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Customer orders lookup error:', error);
    return NextResponse.json({ error: 'Failed to load customer orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const validated = createOrderSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          error: 'Invalid order payload',
          details: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { branchId, customerName, customerPhone, customerEmail, deliveryAddress, notes, paymentMethod, items } = validated.data;

    const branch = await prisma.branch.findUnique({
      where: { id: branchId },
      include: { organization: true },
    });

    if (!branch) {
      return NextResponse.json({ error: 'Selected pharmacy branch not found.' }, { status: 404 });
    }

    const normalizedPhone = customerPhone ? customerPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '') : null;
    const normalizedEmail = customerEmail ? customerEmail.toLowerCase().trim() : null;

    let customer = null;
    if (normalizedPhone || normalizedEmail) {
      customer = await prisma.customer.findFirst({
        where: {
          organizationId: branch.organizationId,
          OR: [
            ...(normalizedPhone ? [{ phone: { equals: normalizedPhone, mode: 'insensitive' } }] : []),
            ...(normalizedEmail ? [{ email: { equals: normalizedEmail, mode: 'insensitive' } }] : []),
          ],
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            organizationId: branch.organizationId,
            name: customerName,
            phone: normalizedPhone,
            email: normalizedEmail,
            address: deliveryAddress,
            notes,
          },
        });
      }
    }

    const lineItems = [];
    let subtotal = 0;

    for (const item of items) {
      const batch = await prisma.medicineBatch.findUnique({
        where: { id: item.batchId },
        include: { medicine: true },
      });

      if (!batch || batch.branchId !== branchId || batch.medicineId !== item.medicineId || batch.status !== 'ACTIVE') {
        return NextResponse.json({ error: `Invalid medicine batch for ${item.medicineId}.` }, { status: 400 });
      }

      const unitPrice = Number(batch.sellingPrice);
      const total = unitPrice * item.quantity;
      subtotal += total;

      lineItems.push({
        medicineId: item.medicineId,
        batchId: item.batchId,
        quantity: item.quantity,
        unitPrice,
        total,
      });
    }

    const order = await prisma.customerOrder.create({
      data: {
        organizationId: branch.organizationId,
        branchId,
        customerId: customer?.id || null,
        customerName,
        customerPhone: normalizedPhone,
        customerEmail: normalizedEmail,
        deliveryAddress,
        notes,
        subtotal,
        deliveryFee: 0,
        total: subtotal,
        paymentMethod,
        items: {
          create: lineItems,
        },
      },
      include: {
        branch: { select: { id: true, name: true, code: true, city: true, address: true } },
        items: {
          include: {
            medicine: { select: { id: true, name: true, genericName: true } },
            batch: { select: { id: true, batchNumber: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (error) {
    console.error('Create customer order error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place order' }, { status: 500 });
  }
}
