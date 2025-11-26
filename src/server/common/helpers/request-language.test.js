import { describe, it, expect, afterEach, vi } from 'vitest'
import { registerLanguageExtension } from './request-language.js'

function makeI18nMock(locale = 'en', catalog = {}) {
  return {
    getLocale: vi.fn(() => locale),
    getCatalog: vi.fn(() => catalog)
  }
}

function makeRequest(overrides = {}) {
  return {
    query: {},
    params: {},
    path: '/test',
    app: {},
    logger: { error: vi.fn() },
    i18n: makeI18nMock(),
    ...overrides
  }
}

const h = {
  state: vi.fn(),
  redirect: (url) => ({
    takeover: () => ({ redirectTo: url, takeover: true })
  }),
  continue: Symbol('continue')
}

describe.skip('registerLanguageExtension', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to en and loads translations when lang missing', () => {
    const request = makeRequest({
      i18n: makeI18nMock('en', { hello: 'world' })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'world' })
    expect(request.i18n.getCatalog).toHaveBeenCalledWith('en')
  })

  it('accepts uppercase EN and loads en translations', () => {
    const request = makeRequest({
      query: { lang: 'EN' },
      i18n: makeI18nMock('en', { hello: 'upper' })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'upper' })
  })

  it('accepts cy and loads cy translations', () => {
    const request = makeRequest({
      query: { lang: 'cy' },
      i18n: makeI18nMock('cy', { hej: 'cy' })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('cy')
    expect(request.app.translations).toEqual({ hej: 'cy' })
  })

  it('redirects to same path with lang=en when explicit non-allowed lang provided', () => {
    const request = makeRequest({
      query: { lang: 'xx', foo: 'bar' },
      path: '/some/path',
      i18n: makeI18nMock('en', { hello: 'world' })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toEqual({ redirectTo: expect.any(String), takeover: true })
    const redirectTo = result.redirectTo
    expect(redirectTo.startsWith(request.path)).toBe(true)
    expect(redirectTo).toContain('lang=en')
    expect(redirectTo).toContain('foo=bar')
  })

  it('falls back to empty translations if getCatalog returns undefined', () => {
    const request = makeRequest({
      query: { lang: 'en' },
      i18n: makeI18nMock('en', undefined)
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({})
  })

  it('trims whitespace around lang and normalizes to lowercase', () => {
    const request = makeRequest({
      query: { lang: '  En  ' },
      i18n: makeI18nMock('en', { trimmed: true })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ trimmed: true })
  })

  it('treats non-string lang values as missing and defaults to en', () => {
    const request = makeRequest({
      query: { lang: ['en'] },
      i18n: makeI18nMock('en', { ok: true })
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ ok: true })
  })
})
