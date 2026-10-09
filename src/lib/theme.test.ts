import { cycleTheme, resolveReducedMotion, resolveTheme } from './theme'

describe('theme', () => {
  it('follows system when pref is system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
  it('manual pref overrides system', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('cycles system -> light -> dark -> system', () => {
    expect(cycleTheme('system')).toBe('light')
    expect(cycleTheme('light')).toBe('dark')
    expect(cycleTheme('dark')).toBe('system')
  })
  it('resolves reduced motion from in-app toggle or OS', () => {
    expect(resolveReducedMotion('system', true)).toBe(true)
    expect(resolveReducedMotion('system', false)).toBe(false)
    expect(resolveReducedMotion('reduce', false)).toBe(true)
    expect(resolveReducedMotion('full', true)).toBe(false)
  })
})
