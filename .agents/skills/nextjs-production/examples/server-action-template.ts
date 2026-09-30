'use server';

/**
 * PRODUCTION-READY SERVER ACTION TEMPLATE (Next.js 16 / React 19)
 *
 * Demonstrates:
 * 1. Safe authentication and session checking via cookies().
 * 2. Zod boundary schema validation with typed field error reporting.
 * 3. Graceful error response formatting (preventing unhandled rejections).
 * 4. Immediate read-your-own-writes cache expiration via updateTag().
 * 5. Targeted path revalidation with revalidatePath().
 */

import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { cookies } from 'next/headers';

// 1. Schema Definition
const CreateMedicineSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  genericName: z.string().optional(),
  sku: z.string().min(3).max(50),
  price: z.number().positive('Price must be greater than zero'),
  stock: z.number().int().nonnegative('Stock cannot be negative'),
});

export type CreateMedicineInput = z.infer<typeof CreateMedicineSchema>;

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[] | undefined> };

export async function createMedicineAction(rawInput: unknown): Promise<ActionResponse<{ id: string }>> {
  try {
    // 2. Auth Guard
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('auth_token')?.value;

    if (!sessionToken) {
      return { success: false, error: 'Unauthorized: You must be logged in to perform this action.' };
    }

    // 3. Schema Validation
    const validation = CreateMedicineSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        error: 'Validation failed: Please check your input fields.',
        fieldErrors: validation.error.flatten().fieldErrors,
      };
    }

    const { name, genericName, sku, price, stock } = validation.data;

    // 4. Persistence Operation (Mocked / Prisma)
    // In production with Prisma:
    // const created = await prisma.product.create({ data: { name, genericName, sku, price, stock } });
    const created = {
      id: `medicine-${Date.now()}`,
      name,
      genericName,
      sku,
      price,
      stock,
    };

    // 5. Targeted Cache Revalidation
    // Next.js 16: Use updateTag() inside Server Actions for immediate cache expiration.
    // (Note: If using revalidateTag in Next.js 16, a profile argument is required: revalidateTag(tag, 'max'))
    updateTag('medicine-list');
    revalidatePath('/dashboard/inventory');

    return { success: true, data: { id: created.id } };
  } catch (error) {
    console.error('[createMedicineAction] Unexpected error:', error);
    return {
      success: false,
      error: 'An unexpected internal error occurred. Please try again later.',
    };
  }
}
