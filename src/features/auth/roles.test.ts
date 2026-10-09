import { homePathFor, isCoachRole } from './roles'

describe('roles', () => {
  it('admin and coach are coach roles', () => {
    expect(isCoachRole('admin')).toBe(true)
    expect(isCoachRole('coach')).toBe(true)
    expect(isCoachRole('athlete')).toBe(false)
    expect(isCoachRole(undefined)).toBe(false)
  })
  it('routes each role home', () => {
    expect(homePathFor('admin')).toBe('/today')
    expect(homePathFor('athlete')).toBe('/me')
  })
})
