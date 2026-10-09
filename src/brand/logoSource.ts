/**
 * LOGO SWAP POINT.
 * Drop the real logo at `assets/logo.png` and it is used everywhere (header, login,
 * splash, reports). When the file is absent, the inline SVG wordmark placeholder renders.
 */
const found = import.meta.glob('/assets/logo.png', { eager: true, query: '?url', import: 'default' }) as Record<
  string,
  string
>

export const LOGO_URL: string | null = Object.values(found)[0] ?? null
