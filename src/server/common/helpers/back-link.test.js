import { describe, it, expect, vi } from 'vitest'
import {
  getBackLink,
  getUrl,
  stripLang,
  updateHistory,
  getPrevious
} from './back-link.js'

const MAX_HISTORY = 20

function mockRequest({
  path = '/test',
  query = {},
  state = {},
  sessionId = 'sess123',
  history = [],
  viewContext = {}
} = {}) {
  return {
    path,
    query,
    state: { session: { id: sessionId }, ...state },
    auth: { credentials: { id: sessionId } },
    response: { variety: 'view', source: { context: viewContext } },
    server: {
      app: {
        cache: {
          get: vi.fn().mockResolvedValue(history),
          set: vi.fn().mockResolvedValue()
        }
      }
    }
  }
}

function mockH() {
  return { continue: Symbol('continue'), state: vi.fn() }
}

describe('getBackLink', () => {
  it('returns default back link when no session ID exists', async () => {
    const req = mockRequest({ sessionId: undefined })
    req.state = {}
    req.auth = {}
    const h = mockH()
    await getBackLink(req, h)
    expect(req.response.source.context.backLinkUrl).toBe('/?lang=en')
    expect(h.state).not.toHaveBeenCalled()
  })

  it('stores history under sessionId and updates it', async () => {
    const req = mockRequest({
      path: '/page1',
      query: { foo: 'bar' },
      sessionId: 'sess123',
      history: []
    })
    const h = mockH()
    await getBackLink(req, h)
    expect(req.server.app.cache.set).toHaveBeenCalledTimes(1)
    const savedHistory = req.server.app.cache.set.mock.calls[0][1]
    expect(savedHistory.length).toBe(1)
    expect(savedHistory[0].full).toBe('/page1?foo=bar')
  })

  it('computes correct back link when history exists', async () => {
    const req = mockRequest({
      path: '/page3',
      query: { x: '1', lang: 'fr' },
      sessionId: 'sess999',
      history: [
        { key: '/page1', full: '/page1' },
        { key: '/page2?foo=baz', full: '/page2?foo=baz' }
      ]
    })
    const h = mockH()
    await getBackLink(req, h)
    expect(req.response.source.context.backLinkUrl).toBe(
      '/page2?foo=baz&lang=fr'
    )
  })

  it('trims history to MAX_HISTORY', async () => {
    const longHistory = Array.from({ length: 40 }).map((_, i) => ({
      key: `/p${i}`,
      full: `/p${i}`
    }))
    const req = mockRequest({
      path: '/final',
      sessionId: 'sessA',
      history: longHistory
    })
    const h = mockH()
    await getBackLink(req, h)
    const saved = req.server.app.cache.set.mock.calls[0][1]
    expect(saved.length).toBe(MAX_HISTORY)
  })

  it('returns root when history has 0 or 1 entries', async () => {
    const req = mockRequest({ sessionId: 'sessX', history: [] })
    const h = mockH()
    await getBackLink(req, h)
    expect(req.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  describe('getBackLink edge cases for full coverage', () => {
    it('handles missing session gracefully', async () => {
      const req = {
        path: '/edge',
        query: {},
        state: {}, // no session cookie at all
        response: { variety: 'view', source: { context: {} } },
        server: {
          app: {
            cache: {
              get: vi.fn().mockResolvedValue([]),
              set: vi.fn().mockResolvedValue()
            }
          }
        }
      }

      const h = { continue: Symbol('continue'), state: vi.fn() }

      await getBackLink(req, h)

      expect(h.state).not.toHaveBeenCalled()
      expect(req.response.source.context.backLinkUrl).toBe('/?lang=en')
    })

    it('trims history correctly when history is exactly MAX_HISTORY + 1', async () => {
      const longHistory = Array.from({ length: MAX_HISTORY + 1 }).map(
        (_, i) => ({ key: `/p${i}`, full: `/p${i}` })
      )
      const req = mockRequest({
        path: '/trim',
        sessionId: 'sessTrim',
        history: longHistory
      })
      const h = mockH()
      await getBackLink(req, h)
      const saved = req.server.app.cache.set.mock.calls[0][1]
      expect(saved.length).toBe(MAX_HISTORY)
    })
  })
})

describe('Helper functions', () => {
  it('getUrl builds correct query string', () => {
    expect(getUrl({ path: '/p', query: { a: 1, b: 2 } })).toBe('/p?a=1&b=2')
  })

  it('getUrl handles undefined query', () => {
    expect(getUrl({ path: '/noquery' })).toBe('/noquery')
  })

  it('stripLang removes lang param', () => {
    expect(stripLang('/page?foo=1&lang=en')).toBe('/page?foo=1')
    expect(stripLang('/page?lang=en')).toBe('/page')
  })

  it('stripLang returns path only when no query remains', () => {
    expect(stripLang('/page?lang=en')).toBe('/page')
  })

  it('updateHistory appends on new page', () => {
    const result = updateHistory([], '/a', '/a')
    expect(result.length).toBe(1)
  })

  it('updateHistory trims on revisit', () => {
    const hist = [
      { key: '/a', full: '/a' },
      { key: '/b', full: '/b' },
      { key: '/c', full: '/c' }
    ]
    const result = updateHistory(hist, '/b', '/b')
    expect(result.length).toBe(2)
    expect(result[1].key).toBe('/b')
  })

  it('getPrevious returns / when only one entry', () => {
    expect(getPrevious([{ key: '/a', full: '/a' }], 'en')).toBe('/?lang=en')
  })

  it('getPrevious returns previous page when history > 1', () => {
    const history = [
      { key: '/page1', full: '/page1?foo=bar' },
      { key: '/page2', full: '/page2?baz=qux' }
    ]
    expect(getPrevious(history, 'fr')).toBe('/page1?foo=bar&lang=fr')
  })

  it('coverage for internal ID handling is exercised via getBackLink', async () => {
    // indirectly triggers generateId and isValidId
    const req = mockRequest({ path: '/x', sessionId: undefined })
    const h = mockH()
    await getBackLink(req, h)
    expect(req.response.source.context.backLinkUrl).toBe('/?lang=en')
  })
})
