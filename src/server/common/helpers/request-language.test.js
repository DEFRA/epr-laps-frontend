import { describe, it, expect, vi, afterEach } from 'vitest'
import { registerLanguageExtension } from './request-language.js'

function makeI18nMock(locale = 'en', catalog = {}) {
  return {
    getCatalog: vi.fn(() => catalog)
  }
}

function makeRequest(overrides = {}) {
  return {
    query: {},
    params: {},
    path: '/test',
    state: {},
    app: {},
    i18n: makeI18nMock(),
    ...overrides
  }
}

function createMockServer() {
  const exts = {}
  return {
    ext: (event, fn) => {
      exts[event] = fn
    },
    exts
  }
}

const h = {
  state: vi.fn(),
  redirect: (url) => ({
    takeover: () => ({ redirectTo: url, takeover: true })
  }),
  continue: Symbol('continue')
}

describe('registerLanguageExtension', () => {
  let server

  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    server = createMockServer()
    registerLanguageExtension(server)
  })

  function runOnPreAuth(request) {
    return server.exts['onPreAuth'](request, h)
  }

  it('defaults to en and loads translations when lang missing', () => {
    const request = makeRequest({
      i18n: makeI18nMock('en', { hello: 'world' })
    })

    const r = runOnPreAuth(request)
    expect(r).toBe(h.continue)

    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'world' })
  })

  it('accepts uppercase EN and loads en translations', () => {
    const request = makeRequest({
      query: { lang: 'EN' },
      i18n: makeI18nMock('en', { hello: 'upper' })
    })

    const r = runOnPreAuth(request)
    expect(r).toBe(h.continue)

    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'upper' })
  })

  it('accepts cy and loads cy translations', () => {
    const request = makeRequest({
      query: { lang: 'cy' },
      i18n: makeI18nMock('cy', { hej: 'cy' })
    })

    runOnPreAuth(request)

    expect(request.app.currentLang).toBe('cy')
    expect(request.app.translations).toEqual({ hej: 'cy' })
  })

  it('redirects when invalid lang is provided', () => {
    const request = makeRequest({
      query: { lang: 'xx', foo: 'bar' },
      path: '/some/path'
    })

    const result = runOnPreAuth(request)

    expect(result).toEqual({
      redirectTo: expect.stringContaining('/some/path'),
      takeover: true
    })
    expect(result.redirectTo).toContain('lang=en')
    expect(result.redirectTo).toContain('foo=bar')
  })

  it('falls back to empty translations if getCatalog returns undefined', () => {
    const request = makeRequest({
      query: { lang: 'en' },
      i18n: makeI18nMock('en', undefined)
    })

    runOnPreAuth(request)

    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({})
  })

  it('trims whitespace and normalizes case', () => {
    const request = makeRequest({
      query: { lang: '  En  ' },
      i18n: makeI18nMock('en', { trimmed: true })
    })

    runOnPreAuth(request)

    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ trimmed: true })
  })

  it('redirects when lang is non-string (invalid)', () => {
    const request = makeRequest({
      query: { lang: ['en'], foo: 'bar' },
      path: '/test'
    })

    const result = runOnPreAuth(request)

    expect(result).toEqual({
      redirectTo: expect.any(String),
      takeover: true
    })

    expect(result.redirectTo).toContain('/test')
    expect(result.redirectTo).toContain('lang=en')
    expect(result.redirectTo).toContain('foo=bar')
  })
})
