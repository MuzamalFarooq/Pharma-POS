# Production Build & Standalone Docker Containerization

To run Next.js cost-effectively in production, use `output: 'standalone'`. This strips all dev dependencies and node_modules bloat, producing a lean production build runnable via `node server.js`.

---

## 1. Enabling Standalone Output

In `next.config.js` or `next.config.ts`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false, // Security: remove X-Powered-By: Next.js
};

export default nextConfig;
```

---

## 2. Multi-Stage Dockerfile Architecture

A production-grade, unprivileged (non-root) Docker build:

```dockerfile
# Stage 1: Base image
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
# Copy prisma schema if using Prisma to generate client
COPY prisma ./prisma/
RUN npm ci

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 4: Production Runner (Lean & Secure)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root system user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone bundle
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

---

## 3. Node Memory Flags for Next.js Builds

For memory-constrained CI/CD runners (GitHub Actions, GitLab CI):
```bash
# Prevents Out-Of-Memory (OOM) errors during webpack/turbopack compilation
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

---

## 4. Healthcheck Endpoint

Always expose a lightweight healthcheck route for load balancers and container orchestrators:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Quick DB ping
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json({ status: 'unhealthy', error: 'Database unreachable' }, { status: 503 });
  }
}
```
