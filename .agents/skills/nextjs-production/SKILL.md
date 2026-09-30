---
name: nextjs-production
description: >-
  Architect, build, optimize, and deploy enterprise-grade, production-ready Next.js applications (App Router, React 19).
  Use when writing or refactoring Next.js code, configuring next.config, building Server Components and Server Actions,
  implementing caching/revalidation (PPR, ISR, static/dynamic), Docker containerization, standalone deployment,
  performance optimization (bundle splitting, next/image, next/font), security headers, and observability.
---

# Next.js Production Engineering Skill

This skill guides the design, implementation, performance tuning, hardening, and deployment of production-grade Next.js applications using the **App Router** and **React 19**.

---

## Modern Next.js Production Tenets

1. **Async Request APIs**: In modern Next.js (15+ / 16+), `params`, `searchParams`, `cookies()`, and `headers()` are asynchronous. Always `await` them. Never access synchronous properties directly.
2. **Server Components by Default**: Treat Client Components (`"use client"`) as leaf nodes. Keep data fetching, secrets, database access (Prisma), and sensitive operations strictly in React Server Components (RSC) or Server Actions.
3. **Deterministic Rendering & Caching**: Clearly distinguish between static pages (`generateStaticParams`, build-time rendered) and dynamic request paths. Use fine-grained revalidation (`revalidateTag`, `revalidatePath`) rather than disabling caching globally.
4. **Secure Server Actions**: Server Actions (`"use server"`) are public POST endpoints. Always authenticate the session, authorize permissions, and validate input with schemas (Zod) inside every action.
5. **Standalone Containerization**: Use `output: 'standalone'` in `next.config` for Docker deployments to produce minimal (~100MB), production-hardened container images.
6. **Robust Error Boundaries**: Every route segment must handle errors gracefully with `error.tsx` (client component), `not-found.tsx`, and a root `global-error.tsx`.

---

## Architectural Modes & Capabilities

```
                       ┌─────────────────────────────────────┐
                       │   Next.js Production Skill Hub      │
                       └──────────────────┬──────────────────┘
           ┌──────────────────────────────┼──────────────────────────────┐
           ▼                              ▼                              ▼
┌──────────────────────┐      ┌──────────────────────┐      ┌──────────────────────┐
│ Mode 1: App Router   │      │ Mode 2: Caching &    │      │ Mode 3: Performance  │
│ & Server Actions     │      │ Rendering Pipeline   │      │ & Asset Optimization │
│ - Async params/APIs  │      │ - Static vs Dynamic  │      │ - next/image & fonts │
│ - RSC Architecture   │      │ - PPR / ISR tags     │      │ - Dynamic imports    │
│ - Zod Server Actions │      │ - revalidateTag/Path │      │ - Bundle analysis    │
└──────────────────────┘      └──────────────────────┘      └──────────────────────┘
           ▲                              ▲                              ▲
           └──────────────────────────────┼──────────────────────────────┘
                                          ▼
                       ┌─────────────────────────────────────┐
                       │ Mode 4: Security, Docker & DevOps   │
                       │ - Standalone Dockerfile builds      │
                       │ - Content Security Policy (CSP)     │
                       │ - Middleware & OpenTelemetry        │
                       └─────────────────────────────────────┘
```

---

## Detailed Production References

Deep-dive into specific production domains with these comprehensive manuals:

| Domain | Reference Manual | Highlights |
| :--- | :--- | :--- |
| **App Router & Async APIs** | [app-router-and-async-apis.md](./references/app-router-and-async-apis.md) | Async `params`, `cookies()`, `headers()`, RSC data patterns, Server Action security. |
| **Caching & Rendering** | [caching-rendering-and-revalidation.md](./references/caching-rendering-and-revalidation.md) | Dynamic vs Static, `unstable_cache`, on-demand tag revalidation, Partial Prerendering (PPR). |
| **Docker & Deployment** | [production-build-and-docker.md](./references/production-build-and-docker.md) | Multi-stage Dockerfile, standalone output, memory management, node environment flags. |
| **Performance & Bundling** | [performance-and-bundle-optimization.md](./references/performance-and-bundle-optimization.md) | Code splitting (`next/dynamic`), `next/font/google`, `next/image` layout, tree-shaking packages. |
| **Security & Headers** | [security-headers-and-middleware.md](./references/security-headers-and-middleware.md) | Strict CSP with nonces, HSTS, Middleware route guards, CSRF in Server Actions. |
| **Observability & Errors** | [observability-and-error-handling.md](./references/observability-and-error-handling.md) | `instrumentation.ts`, OpenTelemetry, Sentry integration, `error.tsx`, `global-error.tsx`. |

---

## Production Readiness Checklist

Before shipping any Next.js feature or service to production:

- [ ] **Async APIs**: Are `params`, `searchParams`, `cookies()`, and `headers()` properly `await`ed?
- [ ] **RSC Isolation**: Is `"use client"` pushed down to the leaves? Are database/Prisma clients and secret keys kept strictly on the server?
- [ ] **Server Action Validation**: Are all Server Actions validating payloads with Zod and verifying auth before performing mutations?
- [ ] **Image & Font Optimization**: Are all raster images using `next/image` with explicit `sizes` and modern formats (AVIF/WebP)? Are fonts loaded via `next/font` with `display: 'swap'`?
- [ ] **Security Headers**: Are CSP, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` configured in `next.config`?
- [ ] **Error Handling**: Are `loading.tsx`, `error.tsx`, and `not-found.tsx` present in critical route segments?
- [ ] **Build Validation**: Does `npm run build` execute with zero TypeScript errors and zero unresolved dynamic server usage warnings?
- [ ] **Standalone Output**: Is `output: 'standalone'` enabled for container deployments?
