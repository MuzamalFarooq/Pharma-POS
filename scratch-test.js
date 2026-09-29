import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Design 4B: Clean modern pharmacy cross + bi-color pill (no dot, sleek glossy highlight)
const svg4b = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
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

  <!-- Squircle Base -->
  <rect width="64" height="64" rx="16" fill="url(#bgGrad)" />
  <rect x="1" y="1" width="62" height="62" rx="15" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.5" />

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

async function run() {
  const dir = path.join(process.cwd(), 'scratch');
  await sharp(Buffer.from(svg4b)).resize(64, 64).png().toFile(path.join(dir, 'test4b_64.png'));
  await sharp(Buffer.from(svg4b)).resize(32, 32).png().toFile(path.join(dir, 'test4b_32.png'));
  await sharp(Buffer.from(svg4b)).resize(16, 16).png().toFile(path.join(dir, 'test4b_16.png'));
  console.log('Done 4b');
}
run();
