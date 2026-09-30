# App Router & Async Request APIs (Next.js 15 / 16 & React 19)

In modern Next.js, asynchronous request execution is fundamental. Synchronous access to runtime request properties is deprecated or removed.

---

## 1. Asynchronous `params` and `searchParams`

In modern App Router pages, layouts, and route handlers, `params` and `searchParams` are Promises.

### Correct Implementation:
```tsx
// app/dashboard/inventory/[id]/page.tsx
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; sort?: string }>;
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  // MUST await params and searchParams
  const { id } = await params;
  const { page = '1', sort = 'desc' } = await searchParams;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  return (
    <main>
      <h1>{product.name}</h1>
      {/* ... */}
    </main>
  );
}
```

---

## 2. Asynchronous `cookies()` and `headers()`

```tsx
import { cookies, headers } from 'next/headers';

export async function getUserSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const headerList = await headers();
  const userAgent = headerList.get('user-agent');

  return { token, userAgent };
}
```

---

## 3. Server Components (RSC) vs Client Components Boundaries

```
[Server Component: ProductList (Fetches DB)]
   │
   ├─► Passes serialized data props (primitives, plain objects, dates)
   │
   ▼
[Client Component: ProductFilterBar ("use client")]
   │ (Handles local state, interactivity, search input)
   │
   ▼
[Server Action: updateProductStatus ("use server")]
   (Triggered via form action or startTransition)
```

### Golden Rules:
1. **Never import server-only modules into Client Components**: Protect DB clients with `import 'server-only'`. If imported by a client file, the build will immediately fail with a helpful compile error.
2. **Push `"use client"` down to the leaf**: Never wrap entire page layouts in `"use client"`. Only wrap specific buttons, modals, or forms requiring browser APIs or React hooks (`useState`, `useEffect`).
3. **Pass Server Components as `children`**: Client components can accept Server Components as `children` or render props without forcing the children to become Client Components.

---

## 4. Production-Grade Server Actions

Server Actions are public POST HTTP endpoints. Treat them with the same security rigor as REST route handlers.

```typescript
'use server';

import { z } from 'zod';
import { revalidatePath, updateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

const UpdateStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(0),
});

export async function updateProductStockAction(formData: FormData) {
  // 1. Authenticate user
  const user = await getCurrentUser();
  if (!user || user.role !== 'PHARMACIST') {
    return { success: false, error: 'Unauthorized operation' };
  }

  // 2. Validate input
  const parse = UpdateStockSchema.safeParse({
    productId: formData.get('productId'),
    quantity: Number(formData.get('quantity')),
  });

  if (!parse.success) {
    return { success: false, error: 'Invalid input data', details: parse.error.flatten() };
  }

  try {
    // 3. Perform atomic mutation
    const updated = await prisma.product.update({
      where: { id: parse.data.productId },
      data: { stock: parse.data.quantity },
    });

    // 4. Targeted cache revalidation (Next.js 16: updateTag in Server Actions)
    updateTag('inventory-list');
    revalidatePath(`/dashboard/inventory/${parse.data.productId}`);

    return { success: true, data: updated };
  } catch (err) {
    console.error('[Action:updateProductStock] Failed:', err);
    return { success: false, error: 'Internal database error' };
  }
}
```
