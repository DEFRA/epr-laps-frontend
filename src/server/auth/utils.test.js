import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as utils from './utils'
import { config } from '../../config/config.js'
import Wreck from '@hapi/wreck'

// --------------------
// Mock Wreck.get
// --------------------
vi.mock('@hapi/wreck', () => ({
  get: vi.fn()
}))

// --------------------
// Mock config.get
// --------------------
vi.spyOn(config, 'get').mockImplementation((key) => {
  if (key === 'back') return 'http://example.com'
  return null
})

describe.skip('#utils', () => {
  let request

  beforeEach(() => {
    request = {
      auth: {
        credentials: {
          token: 'test-token',
          refreshToken: 'refresh-token',
          expiresIn: 3600,
          profile: { sessionId: 'abc123' }
        },
        strategy: 'some-strategy',
        isAuthenticated: true
      },
      state: {
        userSession: { token: 'state-token' }
      },
      logger: { debug: vi.fn(), error: vi.fn() },
      server: { app: { cache: { set: vi.fn() } } },
      cookieAuth: { set: vi.fn() }
    }

    // Mock addSeconds from date-fns
    vi.mock('date-fns', () => ({
      addSeconds: (date, seconds) => new Date(date.getTime() + seconds * 1000)
    }))
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // --------------------
  // getToken
  // --------------------
  describe('getToken', () => {
    it('returns token from auth.credentials', () => {
      const { token } = utils.getToken(request)
      expect(token).toBe('test-token')
    })

    it('returns token from state if auth is missing', () => {
      delete request.auth
      const { token } = utils.getToken(request)
      expect(token).toBe('state-token')
    })

    it('throws Unauthorized if no token', () => {
      delete request.auth
      delete request.state
      expect(() => utils.getToken(request)).toThrow('Unauthorized')
    })
  })

  // --------------------
  // setHeaders
  // --------------------
  describe('setHeaders', () => {
    it('returns Authorization header', () => {
      expect(utils.setHeaders('my-token')).toEqual({
        Authorization: 'Bearer my-token'
      })
    })
  })

  // --------------------
  // getRequest
  // --------------------
  describe('getRequest', () => {
    it('calls Wreck.get and returns payload', async () => {
      Wreck.get.mockResolvedValue({ payload: { data: 123 } })

      const result = await utils.getRequest('http://example.com', {
        Authorization: 'Bearer token'
      })

      expect(Wreck.get).toHaveBeenCalledWith('http://example.com', {
        headers: { Authorization: 'Bearer token' },
        json: true
      })
      expect(result).toEqual({ data: 123 })
    })
  })

  // --------------------
  // fetchWithToken
  // --------------------
  describe('fetchWithToken', () => {
    const path = '/some-url'
    it('calls Wreck.get with correct URL and headers', async () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: 'mock-token' })
      Wreck.get.mockResolvedValue({ payload: { success: true } })

      const result = await utils.fetchWithToken(request, path)

      expect(utils.getToken).toHaveBeenCalledWith(request)
      expect(Wreck.get).toHaveBeenCalledWith('http://example.com/some-url', {
        headers: { Authorization: 'Bearer mock-token' },
        json: true
      })
      expect(result).toEqual({ payload: { success: true } })
    })
  })

  // --------------------
  // setUserSession
  // --------------------
  describe('setUserSession', () => {
    it('sets the user session in cache and cookie', async () => {
      await utils.setUserSession(request)

      expect(request.logger.debug).toHaveBeenCalledWith(
        'Setting user session in cache: abc123'
      )
      expect(request.server.app.cache.set).toHaveBeenCalledWith(
        'abc123',
        expect.objectContaining({
          token: 'test-token',
          refreshToken: 'refresh-token',
          strategy: 'some-strategy',
          isAuthenticated: true,
          expiresIn: 3600 * 1000
        }),
        3600 * 1000
      )
      expect(request.cookieAuth.set).toHaveBeenCalledWith({
        sessionId: 'abc123'
      })
    })
  })

  // --------------------
  // getRoleFromToken
  // --------------------
  describe('getRoleFromToken', () => {
    it('extracts role from token with colon', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({
        token: { roles: ['app:admin'] }
      })
      const role = utils.getRoleFromToken(request)
      expect(role).toBe('admin')
    })

    it('returns the full role if no colon', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({
        token: { roles: ['user'] }
      })
      const role = utils.getRoleFromToken(request)
      expect(role).toBe('user')
    })

    it('returns null if roles array is empty', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: { roles: [] } })
      const role = utils.getRoleFromToken(request)
      expect(role).toBeNull()
    })

    it('returns null if getToken throws', () => {
      vi.spyOn(utils, 'getToken').mockImplementation(() => {
        throw new Error('Unauthorized')
      })
      const role = utils.getRoleFromToken(request)
      expect(role).toBeNull()
    })
  })
})
