import { describe, it, expect, vi, beforeEach } from 'vitest'
import Wreck from '@hapi/wreck'
import jwtDecode from 'jwt-decode'
import * as utils from './utils.js'

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  default: vi.fn()
}))

// Mock @hapi/wreck
vi.mock('@hapi/wreck', () => ({
  default: {
    get: vi.fn()
  }
}))

// Mock request object
const mockRequest = {
  auth: {
    credentials: {
      token: 'token123',
      localAuthority: 'LA1',
      refreshToken: 'refresh123',
      expiresIn: 3600
    },
    strategy: 'cookie',
    isAuthenticated: true
  },
  state: {
    userSession: {
      token: 'tokenFromCookie'
    }
  },
  server: {
    app: {
      cache: {
        set: vi.fn()
      }
    }
  },
  cookieAuth: {
    set: vi.fn()
  },
  logger: {
    debug: vi.fn(),
    error: vi.fn()
  }
}

describe('#utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getToken', () => {
    it('returns token and localAuthority when auth credentials exist', () => {
      const { token, localAuthority } = utils.getToken(mockRequest)
      expect(token).toBe('token123')
      expect(localAuthority).toBe('LA1')
    })

    it('throws Unauthorized if no token', () => {
      const req = { auth: {}, state: {} }
      expect(() => utils.getToken(req)).toThrow('Unauthorized')
    })
  })

  describe('getRoleFromToken', () => {
    it('returns role name when token has roles', () => {
      jwtDecode.mockReturnValue({ roles: ['LA1:Head of Finance'] })
      const role = utils.getRoleFromToken(mockRequest)
      expect(role).toBe('Head of Finance')
    })

    it('returns null if no roles', () => {
      jwtDecode.mockReturnValue({})
      const role = utils.getRoleFromToken(mockRequest)
      expect(role).toBeNull()
    })

    it('logs error and returns null if decoding fails', () => {
      jwtDecode.mockImplementation(() => {
        throw new Error('fail')
      })
      const role = utils.getRoleFromToken(mockRequest)
      expect(role).toBeNull()
      expect(mockRequest.logger.error).toHaveBeenCalled()
    })
  })

  describe('getRequest', () => {
    it('calls Wreck.get with correct params and returns payload', async () => {
      const payload = { data: 'test' }
      Wreck.get.mockResolvedValue({ payload })
      const result = await utils.getRequest('http://example.com', {
        Authorization: 'Bearer token123'
      })
      expect(result).toEqual(payload)
      expect(Wreck.get).toHaveBeenCalledWith('http://example.com', {
        headers: { Authorization: 'Bearer token123' },
        json: true
      })
    })
  })

  describe('fetchWithToken', () => {
    it('calls getToken, setHeaders, and getRequest with correct URL and headers', async () => {
      const pathTemplate = '/bank-details/:localAuthority'
      const payload = { data: 'bank data' }
      Wreck.get.mockResolvedValue({ payload })

      const result = await utils.fetchWithToken(mockRequest, pathTemplate)
      expect(result).toEqual(payload)
      expect(Wreck.get).toHaveBeenCalled()
    })
  })
})
