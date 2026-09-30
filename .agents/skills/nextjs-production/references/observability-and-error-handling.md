# Observability, Error Boundaries & OpenTelemetry

In production, unexpected errors will happen. Graceful degradation, informative error UI, and automated telemetry tracking are non-negotiable.

---

## 1. Route Segment Error Handling (`error.tsx`)

Every primary route segment should have an `error.tsx`. It MUST be a Client Component.

```tsx
// app/dashboard/inventory/error.tsx
'use client';

import { useEffect } from 'react';

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Report to error tracking service (e.g. Sentry / Datadog)
    console.error('[Inventory Error Boundary Caught]:', error);
  }, [error]);

  return (
    <div className="p-8 text-center bg-white rounded-2xl shadow-sm border border-red-100 max-w-lg mx-auto my-12">
      <h2 className="text-xl font-bold text-slate-900 mb-2">Unable to load inventory data</h2>
      <p className="text-slate-600 text-sm mb-6">
        An unexpected error occurred while fetching product stock. Your data is safe.
      </p>
      {error.digest && (
        <p className="text-xs text-slate-400 font-mono mb-4">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="px-5 py-2.5 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-700 transition"
      >
        Retry Loading
      </button>
    </div>
  );
}
```

---

## 2. Global Error Boundary (`global-error.tsx`)

Catches errors in the root layout itself:

```tsx
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">System Error</h1>
          <p className="text-slate-600 mb-6">Something critically failed. We have been notified.</p>
          <button
            onClick={() => reset()}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
```

---

## 3. Server-Side OpenTelemetry & `instrumentation.ts`

To initialize APM monitoring, database tracing, or background services when the Next.js server starts:

```typescript
// instrumentation.ts (Root of project)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize server-side instrumentation (e.g., Sentry, OpenTelemetry, Pino logger)
    console.log('[Instrumentation] Node.js runtime initialized');
  }
}
```

Ensure `experimental.instrumentationHook: true` is enabled in `next.config` if required.
