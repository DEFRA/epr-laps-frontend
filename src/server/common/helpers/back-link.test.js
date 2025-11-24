import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getBackLink, stripForKey } from './back-link.js'

function makeRequest(overrides = {}) {
  const historyStore = overrides.history || []
  return {
    url: { href: overrides.href, pathname: overrides.pathname || '/start' },
    query: overrides.query || {},
    response: overrides.response || {
      variety: 'view',
      source: { context: {} }
    },
    yar: {
      get: vi.fn(() => historyStore),
      set: vi.fn()
    },
    ...overrides
  }
}

describe('Backlink', () => {
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

  it('sets default backLinkUrl when no previous page exists', () => {
    getBackLink(server)
    const request = makeRequest({
      href: '/test?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('adds first page to history', () => {
    getBackLink(server)
    const request = makeRequest({
      href: '/step-one?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.yar.set).toHaveBeenCalledWith(
      'history',
      expect.arrayContaining([{ key: '/step-one', full: '/step-one?lang=en' }])
    )
  })

  it('avoids duplicates when page already in history', () => {
    getBackLink(server)
    const request = makeRequest({
      history: [{ key: '/step-one', full: '/step-one?lang=en' }],
      href: '/step-one?lang=cy',
      query: { lang: 'cy' }
    })
    registeredHandler(request, h)
    expect(request.yar.set).toHaveBeenCalledWith('history', [
      { key: '/step-one', full: '/step-one?lang=en' }
    ])
  })

  it('sets backlink to previous page preserving current lang', () => {
    getBackLink(server)
    const history = [
      { key: '/step-one', full: '/step-one?lang=en' },
      { key: '/step-two', full: '/step-two?lang=en' }
    ]
    const request = makeRequest({
      history,
      href: '/step-three?lang=cy',
      query: { lang: 'cy' }
    })
    registeredHandler(request, h)
    expect(request.response.source.context.backLinkUrl).toBe(
      '/step-two?lang=cy'
    )
  })

  it('limits history to 20 entries', () => {
    getBackLink(server)
    const history = Array.from({ length: 21 }, (_, i) => ({
      key: `/p${i}`,
      full: `/p${i}?lang=en`
    }))
    const request = makeRequest({
      history,
      href: '/new?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.yar.set.mock.calls[0][1].length).toBe(20)
  })

  it('does nothing for non-view response', () => {
    getBackLink(server)
    const request = makeRequest({ response: { variety: 'plain', source: {} } })
    registeredHandler(request, h)
    expect(request.yar.set).not.toHaveBeenCalled()
  })

  it('falls back to pathname when href missing', () => {
    getBackLink(server)
    const request = makeRequest({
      pathname: '/xyz',
      href: undefined,
      query: { lang: 'en' }
    })
    registeredHandler(request, h)

    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('truncates history when revisiting an existing page', () => {
    getBackLink(server)
    const history = [
      { key: '/first', full: '/first?lang=en' },
      { key: '/second', full: '/second?lang=en' },
      { key: '/third', full: '/third?lang=en' }
    ]
    const request = makeRequest({
      history,
      href: '/second?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    const updated = request.yar.set.mock.calls[0][1]
    expect(updated.length).toBe(2)
  })

  it('falls back to default backLinkUrl if previous page has no full URL', () => {
    getBackLink(server)
    const request = makeRequest({
      history: [{ key: '/only', full: null }],
      href: '/newpage?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('covers existingIndex slice (line 248) when revisiting a page', () => {
    getBackLink(server)
    const history = [
      { key: '/page1', full: '/page1?lang=en' },
      { key: '/page2', full: '/page2?lang=en' },
      { key: '/page3', full: '/page3?lang=en' }
    ]
    const request = makeRequest({
      history,
      href: '/page2?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    const updatedHistory = request.yar.set.mock.calls[0][1]
    expect(updatedHistory).toEqual([
      { key: '/page1', full: '/page1?lang=en' },
      { key: '/page2', full: '/page2?lang=en' }
    ])
  })

  it('covers history trimming (line 274) when history > 20', () => {
    getBackLink(server)
    const history = Array.from({ length: 22 }, (_, i) => ({
      key: `/p${i}`,
      full: `/p${i}?lang=en`
    }))
    const request = makeRequest({
      history,
      href: '/newpage?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    const trimmed = request.yar.set.mock.calls[0][1]
    expect(trimmed.length).toBe(20)
  })

  it('covers fallback when previous full is falsy (line 291)', () => {
    getBackLink(server)
    const history = [
      { key: '/one', full: '/one?lang=en' },
      { key: '/two', full: null }
    ]
    const request = makeRequest({
      history,
      href: '/three?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('sets default backLinkUrl when history is empty', () => {
    getBackLink(server)
    const request = makeRequest({
      history: [],
      href: '/new?lang=en',
      query: { lang: 'en' }
    })
    registeredHandler(request, h)
    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })
})

describe('stripForKey', () => {
  it('removes lang query param', () => {
    expect(stripForKey('/test?lang=en&foo=bar')).toBe('/test?foo=bar')
  })

  it('returns just path when only lang present', () => {
    expect(stripForKey('/only-lang?lang=en')).toBe('/only-lang')
  })

  it('handles URL without query params', () => {
    expect(stripForKey('/noparams')).toBe('/noparams')
  })
})
