import { readFileSync } from 'node:fs'

const css = readFileSync('src/styles/tokens.css', 'utf8')

function block(selector: string): Record<string, string> {
  const start = css.indexOf(selector + ' {')
  const body = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*([^;]+);/g)].map((m) => [m[1]!, m[2]!.trim()]))
}

const light = block(':root')
const dark = { ...light, ...block(":root[data-theme='dark']") }

function resolve(vars: Record<string, string>, name: string): string {
  let v = vars[name]!
  while (v.startsWith('var(')) v = vars[v.slice(6, -1)]!
  return v
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!
}
function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi! + 0.05) / (lo! + 0.05)
}

// WCAG AA: 4.5:1 for normal text.
const PAIRS: ReadonlyArray<[string, string]> = [
  ['text', 'bg'],
  ['text', 'surface'],
  ['text-muted', 'bg'],
  ['text-muted', 'surface'],
  ['text-muted', 'surface-2'],
  ['primary-contrast', 'primary'],
  ['secondary-contrast', 'secondary'],
  ['accent-contrast', 'accent'],
  ['primary-text', 'bg'],
  ['primary-text', 'surface'],
  ['success', 'bg'],
  ['warning', 'bg'],
  ['danger', 'bg'],
]

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme contrast (WCAG AA)', (_name, vars) => {
  it.each(PAIRS)('%s on %s >= 4.5', (fg, bg) => {
    expect(contrast(resolve(vars, fg), resolve(vars, bg))).toBeGreaterThanOrEqual(4.5)
  })
})
