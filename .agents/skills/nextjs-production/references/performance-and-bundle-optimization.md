# Performance, Bundle Optimization & Core Web Vitals

Optimizing Next.js for production guarantees instant sub-second page loads, excellent Core Web Vitals (LCP, FID/INP, CLS), and reduced bandwidth usage.

---

## 1. Image Optimization with `next/image`

Never use raw `<img>` tags for content imagery. Use `next/image` to automatically generate AVIF and WebP representations, resize on the fly, and prevent Cumulative Layout Shift (CLS).

### Best Practices:
1. **Always specify `sizes`**: When using `fill`, provide a descriptive `sizes` attribute so the browser downloads the correct image size for the current viewport:
   ```tsx
   <div className="relative w-full h-64">
     <Image
       src={product.imageUrl}
       alt={product.name}
       fill
       sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
       className="object-cover rounded-lg"
       priority={isHero} // Set priority on LCP hero image above the fold
     />
   </div>
   ```
2. **Whitelist External Domains in `next.config`**:
   ```javascript
   images: {
     formats: ['image/avif', 'image/webp'],
     remotePatterns: [
       { protocol: 'https', hostname: 'images.unsplash.com' },
       { protocol: 'https', hostname: '*.s3.amazonaws.com' },
     ],
   }
   ```

---

## 2. Font Optimization with `next/font`

Zero layout shifts and automated local font hosting:

```tsx
// app/layout.tsx
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${inter.variable}`}>
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
```

---

## 3. Dynamic Imports & Lazy Loading (`next/dynamic`)

Never load heavy libraries (Recharts, Canvas, Rich Text Editors) on initial page bundle:

```tsx
import dynamic from 'next/dynamic';

// Heavy chart component loaded only when scrolled into view
const SalesAnalyticsChart = dynamic(
  () => import('@/components/analytics/SalesAnalyticsChart'),
  {
    loading: () => <div className="h-80 w-full animate-pulse bg-slate-100 rounded-xl" />,
    ssr: false, // Disable SSR if the component requires browser canvas/window
  }
);
```

---

## 4. Bundle Analysis

Install `@next/bundle-analyzer` to inspect and purge bloated dependencies:

```bash
ANALYZE=true npm run build
```

Configure in `next.config.js`:
```javascript
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```
