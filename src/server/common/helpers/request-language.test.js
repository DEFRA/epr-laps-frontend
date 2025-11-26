import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { registerLanguageExtension } from './request-language.js'

function makeRequest(overrides = {}) {
  return {
    query: {},
    params: {},
    path: '/test',
    app: {},
    logger: { error: vi.fn() },
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

describe('registerLanguageExtension', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('defaults to en and loads translations when lang missing', () => {
    const fakeJson = JSON.stringify({ hello: 'world' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = makeRequest()
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'world' })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en.json`),
      'utf8'
    )
  })

  it('accepts uppercase EN and loads en translations', () => {
    const fakeJson = JSON.stringify({ hello: 'upper' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = makeRequest({ query: { lang: 'EN' } })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'upper' })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en.json`),
      'utf8'
    )
  })

  it('accepts cy and loads cy translations', () => {
    const fakeJson = JSON.stringify({ hej: 'cy' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = makeRequest({ query: { lang: 'cy' } })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('cy')
    expect(request.app.translations).toEqual({ hej: 'cy' })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}cy.json`),
      'utf8'
    )
  })

  it('redirects to same path with lang=en when explicit non-allowed lang provided', () => {
    const request = makeRequest({
      query: { lang: 'xx', foo: 'bar' },
      path: '/some/path'
    })
    const result = registerLanguageExtension(request, h)

    expect(result).toEqual({ redirectTo: expect.any(String), takeover: true })
    const redirectTo = result.redirectTo
    expect(redirectTo.startsWith(request.path)).toBe(true)
    expect(redirectTo).toContain('lang=en')
    expect(redirectTo).toContain('foo=bar')
  })

  it('falls back to empty translations when readFileSync throws', () => {
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('no file')
    })

    const request = makeRequest({ query: { lang: 'en' } })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({})
    expect(spy).toHaveBeenCalled()
    expect(request.logger.error).toHaveBeenCalled()
  })

  it('treats non-string lang values as missing and defaults to en', () => {
    const fakeJson = JSON.stringify({ ok: true })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = makeRequest({ query: { lang: ['en'] } })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ ok: true })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en.json`),
      'utf8'
    )
  })

  it('trims whitespace around lang and normalizes to lowercase', () => {
    const fakeJson = JSON.stringify({ trimmed: true })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = makeRequest({ query: { lang: '  En  ' } })
    const result = registerLanguageExtension(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ trimmed: true })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en.json`),
      'utf8'
    )
  })
})
