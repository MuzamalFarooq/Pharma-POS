# Security Headers, Middleware & CSRF Hardening

A production Next.js deployment must protect against clickjacking, MIME-type sniffing, cross-site scripting (XSS), and unauthorized routing.

---

## 1. Production Security Headers in `next.config`

Add security headers directly to incoming response paths:

```javascript
// next.config.mjs
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
```

---

## 2. Edge Middleware & Route Guards

Use `middleware.ts` for fast, edge-level authentication redirects and bot filtering:

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/request';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session_token')?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith('/login');
  const isProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/pos');

  // Unauthenticated user trying to access protected area
  if (isProtectedPage && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user trying to access login page
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/pos/:path*', '/login'],
};
```

---

## 3. Server Action Security (CSRF & Origin Matching)

Next.js automatically compares the `Host` header against the `Origin` header on Server Actions. If hosting behind reverse proxies (Nginx, Cloudflare, Traefik), configure `serverActions.allowedOrigins` in `next.config`:

```javascript
experimental: {
  serverActions: {
    allowedOrigins: ['pharmapos.yourdomain.com', 'localhost:3000'],
  },
}
```
