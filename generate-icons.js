const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#14080c" />
  <rect x="16" y="16" width="480" height="480" rx="96" fill="url(#grad)" stroke="#6b1a2a" stroke-width="8" />
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2a0d17" />
      <stop offset="50%" stop-color="#16080e" />
      <stop offset="100%" stop-color="#0d0d0f" />
    </linearGradient>
  </defs>
  
  <!-- Coral / Red accent ring -->
  <circle cx="256" cy="256" r="160" stroke="#e85d5d" stroke-width="6" opacity="0.3" />
  
  <!-- Stylized Gavel / Law Scale Icon -->
  <g transform="translate(136, 136) scale(10)" stroke="#e85d5d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
    <path d="m14 13-7.5 7.5c-.83.83-2.17.83-3 0 0 0 0 0 0 0a2.12 2.12 0 0 1 0-3L11 10" stroke="#e85d5d" />
    <path d="m16 16 6 6" stroke="#fbbf24" stroke-width="2.5" />
    <path d="m8 8 6-6" stroke="#fbbf24" stroke-width="2.5" />
    <path d="m9 7 8 8" stroke="#ffffff" stroke-width="2.5" />
    <path d="m21 11-8-8" stroke="#ffffff" stroke-width="2.5" />
  </g>
</svg>
`;

async function main() {
  const publicDir = path.join(__dirname, 'public');
  const svgBuffer = Buffer.from(svgIcon);

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgBuffer);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));

  // 180x180 (Apple touch icon)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  // 192x192 maskable
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192-maskable.png'));

  // 512x512 maskable
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512-maskable.png'));

  // favicon.png (32x32)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All PWA icons generated successfully in /public!');
}

main().catch(console.error);
