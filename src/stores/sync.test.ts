import { trackWrite, useSync } from './sync'

beforeEach(() => useSync.setState({ online: true, inFlight: 0, restoring: false, status: 'synced' }))

describe('trackWrite', () => {
  it('counts a write as queued until it resolves', async () => {
    let release!: () => void
    const p = trackWrite(new Promise<void>((r) => (release = r)))
    expect(useSync.getState().inFlight).toBe(1)
    expect(useSync.getState().status).toBe('syncing')
    release()
    await p
    expect(useSync.getState().inFlight).toBe(0)
    expect(useSync.getState().status).toBe('synced')
  })
  it('releases the count when the write rejects', async () => {
    await expect(trackWrite(Promise.reject(new Error('denied')))).rejects.toThrow('denied')
    expect(useSync.getState().inFlight).toBe(0)
  })
  it('reports offline with queued writes', () => {
    void trackWrite(new Promise(() => undefined))
    useSync.getState().setOnline(false)
    expect(useSync.getState().status).toBe('offline')
    expect(useSync.getState().inFlight).toBe(1)
  })
})
