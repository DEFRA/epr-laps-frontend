import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import { initializeTestServer } from '../test-helpers/test-server.js'
import { handlePostAuth } from './handle-post-auth.js'

describe('#handlePostAuth', () => {
  let server
  let h

  beforeAll(async () => {
    server = await initializeTestServer()

    h = {
      continue: Symbol('continue'),
      redirect: vi.fn(() => ({
        takeover: vi.fn().mockReturnValue('redirected')
      }))
    }
  })

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
    vi.clearAllMocks()
  })

  const makeRequest = (overrides = {}) => ({
    path: '/dashboard',
    auth: {
      isAuthenticated: false,
      credentials: { roles: [] },
      ...overrides.auth
    },
    ...overrides
  })

  test('Should continue for public paths', () => {
    const request = makeRequest({ path: '/login' })
    const result = handlePostAuth(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should continue if not authenticated', () => {
    const request = makeRequest({ auth: { isAuthenticated: false } })
    const result = handlePostAuth(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should continue if authenticated and has roles', () => {
    const request = makeRequest({
      auth: { isAuthenticated: true, credentials: { roles: ['Finance'] } }
    })
    const result = handlePostAuth(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should redirect if authenticated and roles are empty', () => {
    const request = makeRequest({
      auth: { isAuthenticated: true, credentials: { roles: [] } }
    })
    const result = handlePostAuth(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/no-service-role')
    expect(result).toBe('redirected')
  })

  test('Should continue if request.auth is undefined or path is /no-service-role', () => {
    const request1 = { path: '/secure-dashboard' } // no auth at all
    const request2 = {
      path: '/no-service-role',
      auth: { isAuthenticated: true }
    }

    const result1 = handlePostAuth(request1, h)
    const result2 = handlePostAuth(request2, h)

    expect(result1).toBe(h.continue)
    expect(result2).toBe(h.continue)
  })

  test('Should redirect if authenticated but credentials are missing', () => {
    const request = {
      path: '/secure-dashboard',
      auth: { isAuthenticated: true }
    }
    const result = handlePostAuth(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/no-service-role')
    expect(result).toBe('redirected')
  })
})
