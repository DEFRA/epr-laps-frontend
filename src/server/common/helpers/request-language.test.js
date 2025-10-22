import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { registerLanguageExtension } from './request-language.js'

describe('request-language registerLanguageExtension', () => {
  let server
  let handler
  let fsReadSpy

  beforeEach(() => {
    server = {
      ext: (a, b) => {
        if (typeof a === 'function') {
          handler = a
        } else {
          handler = b
        }
      }
    }

    fsReadSpy = vi.spyOn(fs, 'readFileSync')
  })

  afterEach(() => {
    vi.restoreAllMocks()
    handler = undefined
  })

  it('defaults to "en" when no lang query param provided and loads translations', async () => {
    registerLanguageExtension(server)
    expect(handler).toBeTypeOf('function')

    fsReadSpy.mockImplementation((filePath) => {
      if (filePath.includes(`${path.sep}en${path.sep}translation.json`)) {
        return JSON.stringify({ greeting: 'hello' })
      }
      throw new Error('file not found')
    })

    const request = {
      query: {},
      url: { pathname: '/some/path' },
      app: {},
      state: {}
    }

    const h = { continue: Symbol('continue') }

    const result = handler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.query.lang).toBe('en')
    expect(request.app.translations).toEqual({ greeting: 'hello' })
  })

  it('preserves empty translations when translation file missing for chosen locale', async () => {
    registerLanguageExtension(server)

    fsReadSpy.mockImplementation(() => {
      throw new Error('no file')
    })

    const request = {
      query: { lang: 'cy' },
      url: { pathname: '/whatever' },
      app: {},
      state: {}
    }

    const h = { continue: Symbol('continue') }

    const result = handler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('cy')
    expect(request.query.lang).toBe('cy')
    expect(request.app.translations).toEqual({})
  })

  it('redirects to ?lang=en when an unsupported lang is explicitly provided in the query', async () => {
    registerLanguageExtension(server)

    fsReadSpy.mockImplementation(() => {
      throw new Error('not used')
    })

    const request = {
      query: { lang: 'jhwkj', foo: 'bar' },
      url: { pathname: '/path' },
      app: {},
      state: {}
    }

    const redirectResult = { redirected: true, url: null }
    const h = {
      redirect: (url) => ({
        takeover: () => {
          redirectResult.url = url
          return redirectResult
        }
      })
    }

    const result = handler(request, h)

    expect(result).toBe(redirectResult)
    expect(redirectResult.url.startsWith('/path')).toBe(true)
    expect(redirectResult.url).toContain('lang=en')
    expect(redirectResult.url).toContain('foo=bar')
  })

  it('normalizes complex lang values (EN-US / en_US) to primary subtag and uses it if supported', async () => {
    registerLanguageExtension(server)

    fsReadSpy.mockImplementation((filePath) => {
      if (filePath.includes(`${path.sep}en${path.sep}translation.json`)) {
        return JSON.stringify({ hello: 'world' })
      }
      throw new Error('file not found')
    })

    const request = {
      query: { lang: 'EN-US' },
      url: { pathname: '/' },
      app: {},
      state: {}
    }

    const h = { continue: Symbol('continue') }

    const result = handler(request, h)

    expect(result).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
    expect(request.query.lang).toBe('en')
    expect(request.app.translations).toEqual({ hello: 'world' })

    request.query.lang = 'en_US'
    const result2 = handler(request, h)
    expect(result2).toBe(h.continue)
    expect(request.app.currentLang).toBe('en')
  })
})
