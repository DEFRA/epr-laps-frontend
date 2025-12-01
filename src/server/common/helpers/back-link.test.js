import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  getBackLink,
  updateHistory,
  stripLang,
  getUrl,
  isValidId,
  generateId
} from './back-link.js'

const COOKIE = 'nav'
const MAX_HISTORY = 20

describe('getBackLink', () => {
  let request, h, cache

  beforeEach(() => {
    cache = {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue()
    }

    request = {
      query: {},
      path: '/current',
      response: { variety: 'view', source: { context: {} } },
      state: {},
      server: { app: { cache } }
    }

    h = {
      continue: Symbol('continue'),
      state: vi.fn()
    }
  })

  it('should skip if response is missing', async () => {
    request.response = null
    const result = await getBackLink(request, h)
    expect(result).toBe(h.continue)
  })

  it('should skip if response.variety is not view', async () => {
    request.response.variety = 'other'
    const result = await getBackLink(request, h)
    expect(result).toBe(h.continue)
  })

  it('should generate new navid if invalid', async () => {
    request.state[COOKIE] = 'invalid!'
    await getBackLink(request, h)
    expect(h.state).toHaveBeenCalled()
  })

  it('should use existing valid navid', async () => {
    request.state[COOKIE] = 'abc123'
    await getBackLink(request, h)
    expect(h.state).not.toHaveBeenCalled()
  })

  it('should initialize history if empty', async () => {
    request.state[COOKIE] = 'abc123'
    await getBackLink(request, h)
    expect(cache.set).toHaveBeenCalled()
  })

  it('should update history and trim if exceeds MAX_HISTORY', async () => {
    const longHistory = Array(MAX_HISTORY + 5).fill({ key: 'x', full: '/x' })
    cache.get.mockResolvedValue(longHistory)
    request.state[COOKIE] = 'abc123'
    await getBackLink(request, h)
    const savedHistory = cache.set.mock.calls[0][1]
    expect(savedHistory.length).toBe(MAX_HISTORY)
  })

  it('should compute back link correctly', async () => {
    request.state[COOKIE] = 'abc123'
    request.query.lang = 'fr'
    cache.get.mockResolvedValue([
      { key: 'page1', full: '/page1?foo=bar' },
      { key: 'page2', full: '/page2?foo=baz' }
    ])

    await getBackLink(request, h)
    expect(request.response.source.context.backLinkUrl).toBe(
      '/page2?foo=baz&lang=fr'
    )
  })

  it('should return root when history has 0 or 1 entries', async () => {
    request.state[COOKIE] = 'abc123'
    cache.get.mockResolvedValue([]) // ZERO history entries

    await getBackLink(request, h)
    expect(request.response.source.context.backLinkUrl).toBe('/?lang=en')
  })

  it('updateHistory trims forward history when revisiting a page', () => {
    const history = [
      { key: 'a', full: '/a' },
      { key: 'b', full: '/b' },
      { key: 'c', full: '/c' }
    ]

    const result = updateHistory(history, 'b', '/b')

    expect(result).toEqual([
      { key: 'a', full: '/a' },
      { key: 'b', full: '/b' }
    ])
  })

  it('generateId returns deterministic output when Math.random is mocked', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0.123456)

    const id = generateId()
    expect(id).toBe('4fzyo82m') // Adjust if environment differs

    spy.mockRestore()
  })
})

describe('Helper functions', () => {
  it('stripLang removes lang param', () => {
    expect(stripLang('/path?lang=en&foo=bar')).toBe('/path?foo=bar')
    expect(stripLang('/path')).toBe('/path')
  })

  it('stripLang removes lang when it is the only parameter', () => {
    expect(stripLang('/path?lang=en')).toBe('/path')
  })

  it('getUrl builds URL with query', () => {
    const req = { path: '/test', query: { a: 1, b: 2 } }
    expect(getUrl(req)).toBe('/test?a=1&b=2')
  })

  it('getUrl handles undefined query (covers fallback branch)', () => {
    const req = { path: '/no-query' }
    expect(getUrl(req)).toBe('/no-query')
  })

  it('isValidId validates correctly', () => {
    expect(isValidId('abc123')).toBe(true)
    expect(isValidId('invalid!')).toBe(false)
  })

  it('generateId returns random string', () => {
    const id = generateId()
    expect(id).toMatch(/^[a-z0-9]{6,16}$/i)
  })
})
