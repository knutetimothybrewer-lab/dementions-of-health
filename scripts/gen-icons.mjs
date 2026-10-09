// Renders PWA icons from an SVG mark. Run: node scripts/gen-icons.mjs
// Swap point: replace the SVG below (or point SRC at a PNG exported from assets/logo.png).
import sharp from 'sharp'
import { writeFile } from 'node:fs/promises'

const mark = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
<rect width="512" height="512" fill="#1F3A63"/>
<g transform="translate(256 256) scale(${1 - pad}) translate(-256 -256)">
  <g fill="#D8DDD6">
    <rect x="40" y="330" width="432" height="22" transform="skewX(-14) translate(90 0)"/>
    <rect x="40" y="372" width="360" height="22" transform="skewX(-14) translate(90 0)"/>
    <rect x="40" y="414" width="280" height="22" transform="skewX(-14) translate(90 0)"/>
  </g>
  <text x="256" y="290" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-style="italic" font-size="230" fill="#FFFFFF">TT</text>
</g></svg>`

const out = async (name, size, pad) => {
  const buf = await sharp(Buffer.from(mark(pad))).resize(size, size).png().toBuffer()
  await writeFile(`public/${name}`, buf)
}
await out('pwa-192.png', 192, 0.1)
await out('pwa-512.png', 512, 0.1)
await out('pwa-maskable-512.png', 512, 0.28)
await out('apple-touch-icon.png', 180, 0.1)
console.log('icons written')
