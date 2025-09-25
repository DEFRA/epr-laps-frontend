import { addSeconds } from 'date-fns'
import {
  setUserSession,
  getToken,
  setHeaders,
  getRequest,
  fetchWithToken
} from './utils.js'
import Wreck from '@hapi/wreck'
import { context } from './../../config/nunjucks/context/context.js'
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
    it('returns token and orgname when authedUser exists', async () => {
      context.mockResolvedValue({
        authedUser: { token: 'token123' },
        organisationName: 'LA1'
      })
      const request = {}
      const result = await getToken(request)
      expect(result).toEqual({ token: 'token123', localAuthority: 'LA1' })
    })

    it('throws Unauthorized if no token', async () => {
      context.mockResolvedValue({ authedUser: null })
      const request = {}
      await expect(getToken(request)).rejects.toThrow('Unauthorized')
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
      const token = 'token123'
      const localAuthority = 'LA1' // <--- use localAuthority
      const request = {}
      const pathTemplate = '/bank-details/:localAuthority' // <--- use :localAuthority
      const apiBaseUrl = 'http://backend.test'
      const payload = { data: 'bank data' }

      // Mock context to return localAuthority
      context.mockResolvedValue({
        authedUser: { token },
        organisationName: localAuthority
      })
      config.get.mockReturnValue(apiBaseUrl)
      Wreck.get.mockResolvedValue({ payload })

      const result = await fetchWithToken(request, pathTemplate)

      expect(result).toEqual(payload)

      // pathTemplate should be replaced with localAuthority
      expect(Wreck.get).toHaveBeenCalledWith(
        `${apiBaseUrl}/bank-details/${encodeURIComponent(localAuthority)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          json: true
        }
      )
    })
  })
})
