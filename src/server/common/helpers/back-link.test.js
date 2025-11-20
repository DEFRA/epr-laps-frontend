import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBackLink } from './back-link.js'

// Mock yar session store
function makeRequest(overrides = {}) {
  const historyStore = overrides.history || []

  return {
    url: { href: overrides.href, pathname: overrides.pathname || '/start' },
    query: overrides.query || {},
    response: overrides.response,
    yar: {
      get: vi.fn(() => historyStore),
      set: vi.fn()
    },
    ...overrides
  }
}

describe('getBackLink', () => {
  let registeredHandler

  const server = {
    ext(event, handler) {
      expect(event).toBe('onPreResponse')
      registeredHandler = handler
    }
  }

  const h = { continue: Symbol('continue') }

  beforeEach(() => {
    registeredHandler = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the onPreResponse handler', () => {
    getBackLink(server)
    expect(typeof registeredHandler).toBe('function')
  })

  it('sets default backlink when no history exists', () => {
    getBackLink(server)

    const request = makeRequest({
      query: { lang: 'en' },
      response: {
        variety: 'view',
        source: { context: {} }
      },
      href: '/page-one?lang=en'
    })

    const result = registeredHandler(request, h)
    expect(result).toBe(h.continue)

    const ctx = request.response.source.context
    expect(ctx.backLinkUrl).toBe('/?lang=en')
  })

  it('stores the first visited page into history', () => {
    getBackLink(server)

    const request = makeRequest({
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } },
      href: 'https://domain.com/step-one?lang=en'
    })

    registeredHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'history',
      expect.arrayContaining([
        expect.objectContaining({
          key: '/step-one',
          full: 'https://domain.com/step-one?lang=en'
        })
      ])
    )
  })

  it('does not duplicate history entries when lang changes', () => {
    getBackLink(server)

    const existing = [{ key: '/step-one', full: '/step-one?lang=en' }]

    const request = makeRequest({
      history: existing,
      query: { lang: 'cy' },
      response: { variety: 'view', source: { context: {} } },
      href: '/step-one?lang=cy'
    })

    registeredHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'history',
      existing // unchanged!
    )
  })

  it('creates backlink to previous page in history', () => {
    getBackLink(server)

    const history = [
      { key: '/step-one', full: '/step-one?lang=en' },
      { key: '/step-two', full: '/step-two?lang=en' }
    ]

    const request = makeRequest({
      history,
      query: { lang: 'cy' },
      response: { variety: 'view', source: { context: {} } },
      href: '/step-three?lang=cy'
    })

    registeredHandler(request, h)

    const ctx = request.response.source.context
    expect(ctx.backLinkUrl).toBe('/step-two?lang=cy')
  })

  it('preserves current lang in back link', () => {
    getBackLink(server)

    const history = [
      { key: '/bank/start', full: '/bank/start?lang=en' },
      { key: '/bank/details', full: '/bank/details?lang=en' }
    ]

    const request = makeRequest({
      history,
      query: { lang: 'cy' },
      response: { variety: 'view', source: { context: {} } },
      href: '/bank/confirm?lang=cy'
    })

    registeredHandler(request, h)

    const ctx = request.response.source.context
    expect(ctx.backLinkUrl).toBe('/bank/details?lang=cy')
  })

  it('strips domain when storing key and full path values', () => {
    getBackLink(server)

    const request = makeRequest({
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } },
      href: 'https://example.com/bank/info?lang=en'
    })

    registeredHandler(request, h)

    expect(request.yar.set).toHaveBeenCalledWith(
      'history',
      expect.arrayContaining([
        expect.objectContaining({
          key: '/bank/info',
          full: 'https://example.com/bank/info?lang=en'
        })
      ])
    )
  })

  it('does nothing when response is not a view', () => {
    getBackLink(server)

    const request = makeRequest({
      response: { variety: 'plain', source: {} }
    })

    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.yar.set).not.toHaveBeenCalled()
  })

  it('falls back to pathname when href is missing', () => {
    getBackLink(server)

    const request = makeRequest({
      pathname: '/xyz',
      response: { variety: 'view', source: { context: {} } },
      query: {}
    })

    delete request.url.href // force missing href

    registeredHandler(request, h)

    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('returns empty key when url is missing in history entry', () => {
    getBackLink(server)

    const request = makeRequest({
      history: [{ key: '', full: null }],
      response: { variety: 'view', source: { context: {} } },
      query: { lang: 'en' },
      href: '/next?lang=en'
    })

    registeredHandler(request, h)

    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('handles URLs with no query parameters', () => {
    getBackLink(server)

    const request = makeRequest({
      response: { variety: 'view', source: { context: {} } },
      query: { lang: 'en' },
      href: '/noquery'
    })

    registeredHandler(request, h)

    expect(request.yar.set).toHaveBeenCalled()
  })

  it('returns only path when cleaned query params are empty', () => {
    getBackLink(server)

    const request = makeRequest({
      response: { variety: 'view', source: { context: {} } },
      query: { lang: 'en' },
      href: '/test?lang=en'
    })

    registeredHandler(request, h)

    const history = request.yar.set.mock.calls[0][1]
    expect(history[0].key).toBe('/test') // no ?anything
  })

  it('treats null history as empty array', () => {
    getBackLink(server)

    const request = makeRequest({
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } }
    })

    request.yar.get.mockReturnValueOnce(null)

    registeredHandler(request, h)

    expect(request.yar.set).toHaveBeenCalled()
  })

  it('adds new entry when page does not exist in history', () => {
    getBackLink(server)

    const request = makeRequest({
      history: [{ key: '/first', full: '/first?lang=en' }],
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } },
      href: '/second?lang=en'
    })

    registeredHandler(request, h)

    const history = request.yar.set.mock.calls[0][1]
    expect(history.length).toBe(2)
  })

  it('shifts history when exceeding limit of 20', () => {
    getBackLink(server)

    const history = Array.from({ length: 21 }).map((_, i) => ({
      key: `/p${i}`,
      full: `/p${i}?lang=en`
    }))

    const request = makeRequest({
      history,
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } },
      href: '/new?lang=en'
    })

    registeredHandler(request, h)

    const updated = request.yar.set.mock.calls[0][1]

    expect(updated.length).toBe(21)
  })

  it('falls back when previous history entry has no full URL', () => {
    getBackLink(server)

    const history = [
      { key: '/one', full: '/one?lang=en' },
      { key: '/two', full: null }
    ]

    const request = makeRequest({
      history,
      query: { lang: 'en' },
      response: { variety: 'view', source: { context: {} } },
      href: '/three?lang=en'
    })

    registeredHandler(request, h)

    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })
})
