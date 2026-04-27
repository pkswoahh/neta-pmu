import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const svgIcon = (size, opts = {}) => {
  const { maskable = false, accentDot = true } = opts
  // For maskable, content should sit in safe zone (~80% of canvas)
  const padding = maskable ? size * 0.18 : size * 0.12
  const inner = size - padding * 2
  const fontSize = inner * 0.62
  const dotR = inner * 0.085
  // Dot position roughly to the right of the N baseline
  const cx = padding + inner * 0.78
  const cy = padding + inner * 0.74
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0F0F0F" ${maskable ? '' : `rx="${size * 0.18}"`}/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="${fontSize}" fill="#FFFFFF">N</text>
  ${accentDot ? `<circle cx="${cx}" cy="${cy}" r="${dotR}" fill="#E8A598"/>` : ''}
</svg>`
}

const targets = [
  { size: 192, name: 'public/icon-192.png', maskable: false },
  { size: 512, name: 'public/icon-512.png', maskable: false },
  { size: 512, name: 'public/icon-maskable-512.png', maskable: true },
  { size: 180, name: 'public/apple-touch-icon.png', maskable: false },
]

for (const t of targets) {
  const svg = svgIcon(t.size, { maskable: t.maskable })
  await sharp(Buffer.from(svg)).png().toFile(t.name)
  console.log('✓', t.name)
}

// Update favicon.svg to a higher quality version too
await writeFile('public/favicon.svg', svgIcon(64))
console.log('✓ public/favicon.svg')
