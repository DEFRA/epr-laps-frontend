import { addSeconds } from 'date-fns'
import { setUserSession } from './utils.js'

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
          organisationName: 'Mock Org Name',
          sessionId: 'test-session-id-123'
        }),
        3600 * 1000
      )
    })
  })
})
