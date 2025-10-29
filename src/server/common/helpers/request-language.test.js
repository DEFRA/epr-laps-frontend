import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { registerLanguageExtension } from './request-language.js'

function makeRequest(overrides = {}) {
  return {
    query: {},
    path: '/test',
    app: {},
    log: vi.fn(),
    logger: { error: vi.fn() },
    ...overrides
  }
}

describe('registerLanguageExtension', () => {
  let registeredHandler

  const server = {
    ext(event, handler) {
      expect(event).toBe('onRequest')
      registeredHandler = handler
    }
  }

  const h = {
    redirect: (url) => ({
      takeover: () => ({ redirectTo: url, takeover: true })
    }),
    continue: Symbol('continue')
  }

  beforeEach(() => {
    registeredHandler = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the handler on the server', () => {
    registerLanguageExtension(server)
    expect(typeof registeredHandler).toBe('function')
  })

  it('defaults to en and loads translations when lang missing', () => {
    registerLanguageExtension(server)

    const fakeJson = JSON.stringify({ hello: 'world' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = { query: {}, path: '/test', app: {}, log: vi.fn() }
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'world' })
    expect(spy).toHaveBeenCalled()
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en${path.sep}translation.json`),
      'utf8'
    )
  })

  it('accepts uppercase EN and loads en translations', () => {
    registerLanguageExtension(server)

    const fakeJson = JSON.stringify({ hello: 'upper' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = { query: { lang: 'EN' }, path: '/p', app: {}, log: vi.fn() }
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'upper' })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en${path.sep}translation.json`),
      'utf8'
    )
  })

  it('accepts cy and loads cy translations', () => {
    registerLanguageExtension(server)

    const fakeJson = JSON.stringify({ hej: 'cy' })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = {
      query: { lang: 'cy' },
      path: '/cy',
      app: {},
      log: vi.fn()
    }
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('cy')
    expect(request.app.translations).toEqual({ hej: 'cy' })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}cy${path.sep}translation.json`),
      'utf8'
    )
  })

  it('redirects to same path with lang=en when explicit non-allowed lang provided and preserves other query params', () => {
    registerLanguageExtension(server)

    const spy = vi.spyOn(fs, 'readFileSync')

    const request = {
      query: { lang: 'xx', foo: 'bar' },
      path: '/some/path',
      app: {},
      log: vi.fn()
    }

    const result = registeredHandler(request, h)

    expect(result).toEqual({ redirectTo: expect.any(String), takeover: true })
    const redirectTo = result.redirectTo

    expect(redirectTo.startsWith(request.path)).toBe(true)
    expect(redirectTo).toContain('lang=en')
    expect(redirectTo).toContain('foo=bar')
    expect(spy).not.toHaveBeenCalled()
  })

  it('falls back to empty translations when readFileSync throws', () => {
    registerLanguageExtension(server)

    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw new Error('no file')
    })

    const request = makeRequest({ query: { lang: 'en' }, path: '/x' })
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({})
    expect(spy).toHaveBeenCalled()
    expect(request.logger.error).toHaveBeenCalled()
  })

  it('treats non-string lang values as missing and defaults to en', () => {
    registerLanguageExtension(server)

    const fakeJson = JSON.stringify({ ok: true })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = {
      query: { lang: ['en'] },
      path: '/arr',
      app: {},
      log: vi.fn()
    }
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ ok: true })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en${path.sep}translation.json`),
      'utf8'
    )
  })

  it('trims whitespace around lang and normalizes to lowercase', () => {
    registerLanguageExtension(server)

    const fakeJson = JSON.stringify({ trimmed: true })
    const spy = vi.spyOn(fs, 'readFileSync').mockImplementation(() => fakeJson)

    const request = {
      query: { lang: '  En  ' },
      path: '/t',
      app: {},
      log: vi.fn()
    }
    const result = registeredHandler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.app.translations).toEqual({ trimmed: true })
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining(`${path.sep}en${path.sep}translation.json`),
      'utf8'
    )
  })
})
