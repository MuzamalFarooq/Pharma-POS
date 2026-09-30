# Security Hardening, Authentication & Defense-in-Depth

Security is an architectural foundation, not an afterthought. A senior engineer assumes every client is hostile, every token can be forged, and every network packet can be intercepted.

---

## 1. OWASP Top 10 Mitigation Strategies

### 1. Broken Access Control (BAC)
- **Problem**: Relying solely on client-side UI hides (e.g. hiding an "Admin" button) or failing to check resource ownership.
- **Solution**: Check permissions on **every single server route / API handler**.
  - Always verify: `WHERE id = :resource_id AND tenant_id = :session_tenant_id`. Never trust `userId` passed from client query parameters or request body!

### 2. Cryptographic Failures & Secret Storage
- **Passwords**: Never store plain or MD5/SHA256 hashes. Always use **Argon2id** or **bcrypt** with a work factor $\ge 12$.
- **Environment Variables**: Never commit `.env` files with production secrets to version control. Validate environment variables at process boot with schema validation:
  ```typescript
  import { z } from 'zod';
  const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    JWT_SECRET: z.string().min(32),
    PORT: z.coerce.number().default(3000),
  });
  export const env = envSchema.parse(process.env);
  ```

### 3. Injection (SQL, NoSQL, Command)
- Always use parameterized queries or trusted ORMs.
- Never concatenate user strings into raw SQL:
  - `BAD`: `db.query("SELECT * FROM users WHERE name = '" + input + "'")`
  - `GOOD`: `db.query("SELECT * FROM users WHERE name = $1", [input])`

### 4. Cross-Site Scripting (XSS) & Content Security Policy
- Sanitize HTML before rendering if accepting Markdown/Rich Text.
- Configure strict HTTP response headers:
  ```http
  Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none';
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  ```

### 5. Cross-Site Request Forgery (CSRF)
- Use `SameSite: Lax` or `SameSite: Strict` on session cookies.
- For mutation APIs called from browsers, enforce CSRF tokens or custom request headers (`X-Requested-With: XMLHttpRequest`).

---

## 2. Authentication & Authorization Patterns

- **Authentication (AuthN)**: Who are you? (Session cookies, JWT, OAuth, Passkeys).
  - Prefer HTTP-only, Secure, SameSite cookies over storing JWTs in `localStorage` (which is vulnerable to XSS extraction).
- **Authorization (AuthZ)**: What are you allowed to do?
  - **RBAC (Role-Based Access Control)**: Roles (e.g., `PHARMACIST`, `CASHIER`, `ADMIN`) mapped to granular permissions (`MEDICATION:DISPENSE`, `REPORT:VIEW`).
  - **ABAC / PBAC (Attribute / Policy-Based Access Control)**: Rules evaluate context (e.g., "A pharmacist may only dispense narcotics during scheduled store operating hours").

---

## 3. Rate Limiting & Denial of Service (DoS) Defense

1. **API Rate Limiting**:
   - Use token bucket or sliding window counter in Redis.
   - Separate limits for public endpoints (e.g., Login: 5 requests/minute) vs authenticated endpoints (e.g., POS checkout: 100 requests/minute).
2. **Payload Size Limits**:
   - Explicitly cap request body size (`body-parser` max 1MB) to prevent memory exhaustion attacks.
3. **Timing Attack Protection**:
   - Use constant-time comparison functions (`crypto.timingSafeEqual`) when validating API keys, HMAC signatures, or hashes.
