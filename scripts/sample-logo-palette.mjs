// Samples dominant colours from assets/logo.png (if present) so tokens in
// src/styles/tokens.css can be tuned to the real logo. Usage: npm run palette
import sharp from 'sharp'
import { existsSync } from 'node:fs'

const SRC = 'assets/logo.png'
if (!existsSync(SRC)) {
  console.log(`${SRC} not found. Using reference palette (navy #1F3A63, silver #D8DDD6). Drop the logo in and re-run.`)
  process.exit(0)
}
const { data, info } = await sharp(SRC).resize(96, 96, { fit: 'inside' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const buckets = new Map()
for (let i = 0; i < data.length; i += info.channels) {
  const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]]
  if (a < 200) continue
  if (r > 245 && g > 245 && b > 245) continue // ignore white background
  const key = [r, g, b].map((v) => Math.round(v / 16) * 16).join(',')
  buckets.set(key, (buckets.get(key) ?? 0) + 1)
}
const hex = (k) => '#' + k.split(',').map((v) => Math.min(255, Number(v)).toString(16).padStart(2, '0')).join('').toUpperCase()
const top = [...buckets.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
console.log('Dominant non-white colours:')
for (const [k, n] of top) console.log(`  ${hex(k)}  (${n} px)`)
