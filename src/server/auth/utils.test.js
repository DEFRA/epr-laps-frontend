import { addSeconds } from 'date-fns'
import {
  setUserSession,
  getToken,
  setHeaders,
  getRequest,
  fetchWithToken
} from './utils.js'
import Wreck from '@hapi/wreck'
import { config } from './../../config/config.js'

vi.mock('@hapi/wreck')
vi.mock('./../../config/nunjucks/context/context.js')
vi.mock('./../../config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      switch (key) {
        case 'log':
          return {
            enabled: true,
            level: 'info',
            customLevels: { info: 30, error: 50 },
            redact: ['req.headers.authorization']
          }
        case 'backendApiUrl':
          return 'http://backend.test'
        case 'root':
          return '/mock/root'
        case 'assetPath':
          return '/mock/assets'
        case 'serviceName':
          return 'test-service'
        case 'serviceVersion':
          return '1.0.0'
        default:
          return ''
      }
    })
  }
}))

vi.mock('date-fns', () => ({
  addSeconds: vi.fn()
}))

describe('#utils', () => {
  describe('setUserSession', () => {
    let mockRequest
    let mockCache
    let mockCookieAuth

    beforeEach(() => {
      vi.clearAllMocks()

      mockCache = {
        set: vi.fn().mockResolvedValue()
      }

      mockCookieAuth = {
        set: vi.fn()
      }

      mockRequest = {
        auth: {
          credentials: {
            profile: {
              sessionId: 'test-session-id-123',
              relationships: ['rel-1:someId:Mock Org Name'],
              currentRelationshipId: 'rel-1'
            },
            expiresIn: 3600,
            token: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          },
          strategy: 'oauth',
          isAuthenticated: true
        },
        server: {
          app: {
            cache: mockCache
          }
        },
        cookieAuth: mockCookieAuth,
        logger: { debug: vi.fn() }
      }

      const mockExpiryDate = new Date('2024-01-01T12:00:00.000Z')
      addSeconds.mockReturnValue(mockExpiryDate)
    })

    it('should set cookie with session ID', async () => {
      await setUserSession(mockRequest)

      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
      expect(mockCookieAuth.set).toHaveBeenCalledWith({
        sessionId: 'test-session-id-123'
      })
    })

    it('should store session in cache with correct organisationName', async () => {
      await setUserSession(mockRequest)

      expect(mockCache.set).toHaveBeenCalledWith(
        'test-session-id-123',
        expect.objectContaining({
          sessionId: 'test-session-id-123'
        }),
        3600 * 1000
      )
    })
  })

  describe('getToken', () => {
    it('returns token when auth.credentials.token exists', () => {
      const request = {
        auth: {
          credentials: {
            token: 'token123'
          }
        }
      }
      const result = getToken(request)
      expect(result).toEqual({ token: 'token123' })
    })

    it('returns token when userSession token exists', () => {
      const request = {
        state: {
          userSession: {
            token: 'session-token-456'
          }
        }
      }
      const result = getToken(request)
      expect(result).toEqual({ token: 'session-token-456' })
    })

    it('throws Unauthorized if no token found', () => {
      const request = {}
      expect(() => getToken(request)).toThrow('Unauthorized')
    })
  })

  describe('setHeaders', () => {
    it('returns correct Authorization header', () => {
      const token = 'my-token'
      const headers = setHeaders(token)
      expect(headers).toEqual({ Authorization: 'Bearer my-token' })
    })
  })

  describe('getRequest', () => {
    it('calls Wreck.get with correct params and returns payload', async () => {
      const payload = { data: 'test' }
      Wreck.get.mockResolvedValue({ payload })
      const url = 'http://example.com'
      const headers = { Authorization: 'Bearer token123' }

      const result = await getRequest(url, headers)
      expect(Wreck.get).toHaveBeenCalledWith(url, { headers, json: true })
      expect(result).toEqual(payload)
    })
  })

  describe('fetchWithToken', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('calls getToken, setHeaders, and getRequest with correct URL and headers', async () => {
      const request = {
        auth: {
          credentials: {
            token: 'token123'
          }
        }
      }

      const path = '/bank-details/LA1'
      const apiBaseUrl = 'http://backend.test'
      const payload = { data: 'bank data' }

      config.get.mockReturnValue(apiBaseUrl)
      Wreck.get.mockResolvedValue({ payload })

      const result = await fetchWithToken(request, path)

      expect(result).toEqual(payload)

      expect(Wreck.get).toHaveBeenCalledWith(`${apiBaseUrl}${path}`, {
        headers: { Authorization: 'Bearer token123' },
        json: true
      })
    })
  })
})
