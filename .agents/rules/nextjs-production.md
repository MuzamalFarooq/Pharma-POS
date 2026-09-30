# Next.js Production Engineering Standards

Whenever developing, editing, or optimizing Next.js (App Router / React 19) components and routes:

1. **Async Request APIs Rule**:
   - `params`, `searchParams`, `cookies()`, and `headers()` are Promises in this version.
   - Always `await` them before reading properties (`const { id } = await params;`, `const cookieStore = await cookies();`).

2. **Server-First Boundary Discipline**:
   - Default to React Server Components (RSC).
   - Only apply `"use client"` to interactive leaf components needing event listeners, browser hooks (`useState`, `useEffect`), or Web APIs.
   - Guard database clients and server secrets with `import 'server-only'`.

3. **Production Server Actions**:
   - Every Server Action (`"use server"`) is a public endpoint.
   - Always authenticate the user, authorize roles, and validate arguments using Zod schemas inside the action.
   - Use targeted cache invalidation (`revalidateTag` or `revalidatePath`) rather than broad cache disabling.

4. **Performance & Optimization**:
   - Use `next/image` with explicit `sizes` and modern formats (AVIF/WebP) to prevent CLS.
   - Load web fonts via `next/font/google` with `display: 'swap'`.
   - Lazy load heavy client bundles using `next/dynamic`.
   - Use `output: 'standalone'` in `next.config` for lean production Docker deployments.
