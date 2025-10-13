import { describe, test, expect, beforeAll, afterAll, vi } from 'vitest'
import { initializeTestServer } from '../test-helpers/test-server.js'
import { noServiceRole } from './no-service-role.js'

describe('#noServiceRole', () => {
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
    const result = noServiceRole.method(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should continue if not authenticated', () => {
    const request = makeRequest({
      auth: { isAuthenticated: false }
    })
    const result = noServiceRole.method(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should continue if authenticated and has roles', () => {
    const request = makeRequest({
      auth: { isAuthenticated: true, credentials: { roles: ['Finance'] } }
    })
    const result = noServiceRole.method(request, h)
    expect(result).toBe(h.continue)
  })

  test('Should redirect if authenticated and roles are empty', () => {
    const request = makeRequest({
      auth: { isAuthenticated: true, credentials: { roles: [] } }
    })
    const result = noServiceRole.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/no-service-role')
    expect(result).toBe('redirected')
  })

  test('Should have correct extension type', () => {
    expect(noServiceRole.type).toBe('onPreHandler')
  })
})
