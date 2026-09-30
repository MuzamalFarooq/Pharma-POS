# Caching, Rendering & Revalidation Pipeline

Next.js provides a multi-layer caching architecture. Mastering how and when to bust or bypass caches is crucial to avoiding stale inventory or price mismatches in production.

---

## 1. The 4 Caching Layers

1. **Request Memoization (React Cache)**: Deduplicates identical `fetch()` or `cache()` calls during a single server render pass.
2. **Data Cache**: Persists HTTP `fetch` results across incoming requests and deployments (unless explicitly set to `no-store` or revalidated).
3. **Full Route Cache**: Stores HTML and RSC payload at build time or revalidation time for static routes.
4. **Router Cache (Client-side)**: In-memory client cache of visited RSC payloads for snappy back/forward navigation.

---

## 2. Dynamic vs Static Route Segment Configs

Configure route segment behaviors explicitly when needed:

```tsx
// Force dynamic rendering (no build-time caching; evaluated on every request)
export const dynamic = 'force-dynamic';

// Revalidate page at most once every 60 seconds (ISR)
export const revalidate = 60;

// Force dynamic fetch data
export const fetchCache = 'force-no-store';
```

---

## 3. Caching Database / ORM Queries with `unstable_cache`

Unlike `fetch()`, database queries through Prisma or raw SQL do not automatically leverage the Data Cache unless wrapped in `unstable_cache`:

```typescript
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/db';

export const getCachedProductCategories = unstable_cache(
  async (storeId: string) => {
    return prisma.category.findMany({
      where: { storeId },
      orderBy: { name: 'asc' },
    });
  },
  ['store-categories-key'], // Cache key parts
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['categories-tag', 'inventory'],
  }
);
```

---

## 4. On-Demand Revalidation: `updateTag`, `revalidateTag` & `revalidatePath`

In Next.js 16:
- **Inside Server Actions**: Use `updateTag(tag)` for immediate read-your-own-writes expiration.
- **Inside Route Handlers / Background Jobs**: Use `revalidateTag(tag, profile)` with a cacheLife profile (e.g. `'max'` or `{ expire: 0 }`).

```typescript
import { updateTag, revalidatePath, revalidateTag } from 'next/cache';

// Inside a Server Action:
export async function onProductUpdatedAction(productId: string) {
  // Purges cached queries tagged with 'inventory' immediately for the calling client
  updateTag('inventory');
  
  // Revalidates the specific page path
  revalidatePath(`/inventory/${productId}`);
}

// Inside a Route Handler:
export async function POST() {
  revalidateTag('inventory', 'max');
  return Response.json({ revalidated: true });
}
```

---

## 5. Streaming & Partial Prerendering (PPR)

Combine static instant shells with streamed dynamic data:

```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { StatSkeleton } from '@/components/skeletons';
import { DynamicSalesMetrics } from '@/components/sales-metrics';
import { StaticQuickActions } from '@/components/quick-actions';

export default function DashboardPage() {
  return (
    <div>
      {/* Instant static shell */}
      <StaticQuickActions />

      {/* Streamed dynamic metrics */}
      <Suspense fallback={<StatSkeleton />}>
        <DynamicSalesMetrics />
      </Suspense>
    </div>
  );
}
```
