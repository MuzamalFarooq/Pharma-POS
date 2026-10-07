import { NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

const optionalText = (maxLength) =>
  z.string().trim().max(maxLength).optional().or(z.literal('')).transform((value) => value || null);

const orderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).optional().default(1),
});

const createOrderSchema = z.object({
  branchId: z.string().min(1),
  idempotencyKey: z.string().uuid(),
  customerPhone: optionalText(40),
  deliveryAddress: optionalText(500),
  notes: optionalText(1000),
  paymentMethod: z.literal('CASH_ON_DELIVERY').default('CASH_ON_DELIVERY'),
  items: z
    .array(
      z.object({
        medicineId: z.string().min(1),
        quantity: z.number().int().positive().max(999),
      })
    )
    .min(1)
    .max(50)
    .superRefine((items, context) => {
      const medicineIds = new Set();
      items.forEach((item, index) => {
        if (medicineIds.has(item.medicineId)) {
          context.addIssue({
            code: 'custom',
            path: [index, 'medicineId'],
            message: 'A medicine may only appear once in an order.',
          });
        }
        medicineIds.add(item.medicineId);
      });
    }),
});

const PAGE_SIZE = 50;
const orderInclude = {
  organization: { select: { name: true, currency: true } },
  branch: { select: { id: true, name: true, code: true, city: true, address: true } },
  items: {
    include: {
      medicine: { select: { id: true, name: true, genericName: true } },
      batch: { select: { id: true, batchNumber: true } },
    },
  },
};

class CustomerOrderError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const requireCustomer = async () => {
  const session = await getSession();
  if (!session?.user) {
    return { response: NextResponse.json({ error: 'Please sign in to access your customer orders.' }, { status: 401 }) };
  }
  if (session.role !== 'CUSTOMER') {
    return { response: NextResponse.json({ error: 'A customer account is required.' }, { status: 403 }) };
  }
  return { session };
};

export async function GET(request) {
  try {
    const access = await requireCustomer();
    if (access.response) return access.response;

    const query = orderQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!query.success) {
      return NextResponse.json({ error: 'Invalid order history page.' }, { status: 400 });
    }

    const orders = await prisma.customerOrder.findMany({
      where: { customer: { is: { userId: access.session.user.id } } },
      include: orderInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.data.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE + 1,
    });

    const hasMore = orders.length > PAGE_SIZE;
    return NextResponse.json({
      orders: orders.slice(0, PAGE_SIZE),
      pagination: { page: query.data.page, pageSize: PAGE_SIZE, hasMore },
    });
  } catch (error) {
    console.error('Customer orders lookup error:', error);
    return NextResponse.json({ error: 'Failed to load customer orders' }, { status: 500 });
  }
}

export async function POST(request) {
  let validated;
  let session;

  try {
    const access = await requireCustomer();
    if (access.response) return access.response;
    session = access.session;

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    validated = createOrderSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid order payload', details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { branchId, idempotencyKey, customerPhone, deliveryAddress, notes, paymentMethod, items } = validated.data;
    const normalizedPhone = customerPhone ? customerPhone.replace(/\s+/g, '').replace(/[^\d+]/g, '') : null;
    const normalizedEmail = session.user.email.trim().toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const previousOrder = await tx.customerOrder.findFirst({
        where: {
          idempotencyKey,
          customer: { is: { userId: session.user.id } },
        },
        include: orderInclude,
      });
      if (previousOrder) return { order: previousOrder, replay: true };

      const keyInUse = await tx.customerOrder.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });
      if (keyInUse) {
        throw new CustomerOrderError('This order request key has already been used.', 409);
      }

      const branch = await tx.branch.findFirst({
        where: { id: branchId, status: 'ACTIVE' },
        include: { organization: { select: { id: true } } },
      });
      if (!branch) {
        throw new CustomerOrderError('Selected pharmacy branch was not found or is inactive.', 404);
      }

      let customer = await tx.customer.findFirst({
        where: { organizationId: branch.organizationId, userId: session.user.id },
      });

      if (!customer) {
        const unclaimedCustomer = await tx.customer.findFirst({
          where: {
            organizationId: branch.organizationId,
            userId: null,
            email: { equals: normalizedEmail, mode: 'insensitive' },
          },
        });
        if (unclaimedCustomer) {
          customer = await tx.customer.update({
            where: { id: unclaimedCustomer.id },
            data: { userId: session.user.id },
          });
        } else {
          customer = await tx.customer.create({
            data: {
              organizationId: branch.organizationId,
              userId: session.user.id,
              name: session.user.name,
              phone: normalizedPhone,
              email: normalizedEmail,
              address: deliveryAddress,
              notes,
            },
          });
        }
      }

      const medicineIds = items.map((item) => item.medicineId);
      const medicines = await tx.medicine.findMany({
        where: {
          id: { in: medicineIds },
          organizationId: branch.organizationId,
          isActive: true,
        },
        include: {
          batches: {
            where: {
              organizationId: branch.organizationId,
              branchId: branch.id,
              status: 'ACTIVE',
              expiryDate: { gt: new Date() },
              quantity: { gt: 0 },
            },
            select: { id: true, batchNumber: true, quantity: true, sellingPrice: true, expiryDate: true },
            orderBy: [{ expiryDate: 'asc' }, { id: 'asc' }],
          },
        },
      });
      const medicineById = new Map(medicines.map((medicine) => [medicine.id, medicine]));
      const allocations = [];
      let subtotal = 0;

      for (const item of items) {
        const medicine = medicineById.get(item.medicineId);
        if (!medicine) {
          throw new CustomerOrderError('One or more medicines are unavailable at this pharmacy.', 409);
        }

        let remaining = item.quantity;
        for (const batch of medicine.batches) {
          if (remaining === 0) break;
          const quantity = Math.min(remaining, batch.quantity);
          const unitPrice = Number(batch.sellingPrice);
          const total = unitPrice * quantity;
          allocations.push({ medicineId: medicine.id, batchId: batch.id, quantity, unitPrice, total });
          subtotal += total;
          remaining -= quantity;
        }

        if (remaining > 0) {
          throw new CustomerOrderError(`Insufficient stock for ${medicine.name}. Please adjust your cart.`, 409);
        }
      }

      for (const allocation of allocations) {
        const stockUpdate = await tx.medicineBatch.updateMany({
          where: {
            id: allocation.batchId,
            organizationId: branch.organizationId,
            branchId: branch.id,
            status: 'ACTIVE',
            expiryDate: { gt: new Date() },
            quantity: { gte: allocation.quantity },
          },
          data: { quantity: { decrement: allocation.quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new CustomerOrderError('Stock changed while placing your order. Please review your cart and try again.', 409);
        }
      }

      const createdOrder = await tx.customerOrder.create({
        data: {
          organizationId: branch.organizationId,
          branchId: branch.id,
          customerId: customer.id,
          customerName: session.user.name,
          customerPhone: normalizedPhone,
          customerEmail: normalizedEmail,
          deliveryAddress,
          notes,
          subtotal,
          deliveryFee: 0,
          total: subtotal,
          paymentMethod,
          idempotencyKey,
          stockReserved: true,
          items: { create: allocations },
        },
        include: orderInclude,
      });

      await tx.inventoryTransaction.createMany({
        data: allocations.map((allocation) => ({
          organizationId: branch.organizationId,
          branchId: branch.id,
          medicineId: allocation.medicineId,
          batchId: allocation.batchId,
          type: 'SALE',
          quantity: -allocation.quantity,
          referenceId: createdOrder.id,
          notes: `Online customer order ${createdOrder.id}`,
        })),
      });

      return { order: createdOrder, replay: false };
    });

    return NextResponse.json({ success: true, order: result.order }, { status: result.replay ? 200 : 201 });
  } catch (error) {
    if (error instanceof CustomerOrderError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    if (error?.code === 'P2002' && validated?.success && session?.user) {
      const existingOrder = await prisma.customerOrder.findFirst({
        where: {
          idempotencyKey: validated.data.idempotencyKey,
          customer: { is: { userId: session.user.id } },
        },
        include: orderInclude,
      });
      if (existingOrder) {
        return NextResponse.json({ success: true, order: existingOrder }, { status: 200 });
      }
      return NextResponse.json({ error: 'This order request key has already been used.' }, { status: 409 });
    }

    console.error('Create customer order error:', error);
    return NextResponse.json({ error: 'Failed to place order. Please try again.' }, { status: 500 });
  }
}
