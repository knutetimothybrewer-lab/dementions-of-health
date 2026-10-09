import { deriveSyncStatus, syncLabel } from './syncStatus'

describe('deriveSyncStatus', () => {
  it('offline wins over everything', () => {
    expect(deriveSyncStatus({ online: false, inFlight: 3, restoring: true })).toBe('offline')
  })
  it('syncing while writes are in flight or restoring', () => {
    expect(deriveSyncStatus({ online: true, inFlight: 1, restoring: false })).toBe('syncing')
    expect(deriveSyncStatus({ online: true, inFlight: 0, restoring: true })).toBe('syncing')
  })
  it('synced when idle', () => {
    expect(deriveSyncStatus({ online: true, inFlight: 0, restoring: false })).toBe('synced')
  })
  it('labels include queued count', () => {
    expect(syncLabel('synced', 0)).toBe('Synced')
    expect(syncLabel('syncing', 2)).toBe('Syncing 2')
    expect(syncLabel('syncing', 0)).toBe('Syncing')
    expect(syncLabel('offline', 4)).toBe('Offline · 4 queued')
    expect(syncLabel('offline', 0)).toBe('Offline')
  })
})
