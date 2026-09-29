import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function createIco(pngBuffers) {
  // pngBuffers: array of { width, height, buffer }
  const count = pngBuffers.length;
  const headerSize = 6;
  const entrySize = 16;
  const dirSize = headerSize + entrySize * count;

  let offset = dirSize;
  const entries = [];

  for (const item of pngBuffers) {
    const { width, height, buffer } = item;
    const size = buffer.length;

    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // planes
    entry.writeUInt16LE(32, 6); // bit count
    entry.writeUInt32LE(size, 8); // image bytes
    entry.writeUInt32LE(offset, 12); // offset

    entries.push(entry);
    offset += size;
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  return Buffer.concat([header, ...entries, ...pngBuffers.map(p => p.buffer)]);
}

async function buildFavicons() {
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="60%" stop-color="#059669" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>
    <linearGradient id="pillTop" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5eead4" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
    <linearGradient id="pillBottom" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46" />
      <stop offset="100%" stop-color="#022c22" />
    </linearGradient>
    <filter id="shadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="1.5" flood-color="#022c22" flood-opacity="0.35" />
    </filter>
  </defs>

  <!-- Squircle Base with high border contrast -->
  <rect width="64" height="64" rx="16" fill="url(#bgGrad)" />
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.5" />

  <!-- Pharmacy Cross -->
  <g filter="url(#shadow)">
    <path d="M 25 9 C 25 7.3 26.3 6 28 6 L 36 6 C 37.7 6 39 7.3 39 9 L 39 25 L 55 25 C 56.7 25 58 26.3 58 28 L 58 36 C 58 37.7 56.7 39 55 39 L 39 39 L 39 55 C 39 56.7 37.7 58 36 58 L 28 58 C 26.3 58 25 56.7 25 55 L 25 39 L 9 39 C 7.3 39 6 37.7 6 36 L 6 28 C 6 26.3 7.3 25 9 25 L 25 25 Z" fill="#ffffff" />
  </g>

  <!-- Angled Pharmacy Capsule with crisp outline -->
  <g transform="translate(32,32) rotate(-45) translate(-32,-32)" filter="url(#shadow)">
    <!-- Pill Container & Border -->
    <rect x="22" y="15" width="20" height="34" rx="10" fill="#047857" stroke="#ffffff" stroke-width="1.5" />
    
    <!-- Top Half (Teal / Cyan) -->
    <path d="M 23 25 C 23 19.5 27 16 32 16 C 37 16 41 19.5 41 25 L 41 31 L 23 31 Z" fill="url(#pillTop)" />
    
    <!-- Bottom Half (Deep Forest Emerald) -->
    <path d="M 23 33 L 41 33 L 41 39 C 41 44.5 37 48 32 48 C 27 48 23 44.5 23 39 Z" fill="url(#pillBottom)" />
    
    <!-- Crisp White Divider Belt -->
    <rect x="22" y="31" width="20" height="2" fill="#ffffff" />

    <!-- Subtle Shine on Top -->
    <ellipse cx="32" cy="22" rx="4" ry="2" fill="#ffffff" opacity="0.4" />
  </g>
</svg>`;

  const svgBuffer = Buffer.from(svgContent);

  // Generate PNG sizes
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const p180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const p192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const p512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // Create .ico buffer
  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: p16 },
    { width: 32, height: 32, buffer: p32 },
    { width: 48, height: 48, buffer: p48 },
  ]);

  // Write outputs
  // 1. app/icon.svg (Next.js App router native SVG icon)
  fs.writeFileSync(path.join(process.cwd(), 'app', 'icon.svg'), svgContent, 'utf-8');

  // 2. app/favicon.ico
  fs.writeFileSync(path.join(process.cwd(), 'app', 'favicon.ico'), icoBuffer);

  // 3. app/apple-icon.png (Next.js App router native apple touch icon)
  fs.writeFileSync(path.join(process.cwd(), 'app', 'apple-icon.png'), p180);

  // 4. public/favicon.ico (fallback for static requests)
  fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.ico'), icoBuffer);

  // 5. public/icon.svg
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon.svg'), svgContent, 'utf-8');

  // 6. public/apple-touch-icon.png
  fs.writeFileSync(path.join(process.cwd(), 'public', 'apple-touch-icon.png'), p180);

  // 7. public/icon-192.png & public/icon-512.png (PWA ready)
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon-192.png'), p192);
  fs.writeFileSync(path.join(process.cwd(), 'public', 'icon-512.png'), p512);

  console.log('Successfully generated all pharmacy favicons and icons!');
}

buildFavicons().catch(err => {
  console.error(err);
  process.exit(1);
});
