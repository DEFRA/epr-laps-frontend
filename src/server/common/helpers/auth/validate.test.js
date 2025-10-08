import { isPast } from 'date-fns'
import { validateUserSession } from './validate.js'
import { startServer } from '../start-server.js'
import { getOidcConfig } from './get-oidc-config.js'
import * as authUtils from './utils.js'

vi.mock('./get-oidc-config.js')

vi.mock('./utils.js', () => ({
  getUserSession: vi.fn(),
  removeUserSession: vi.fn(),
  refreshAccessToken: vi.fn(),
  updateUserSession: vi.fn()
}))

vi.mock('date-fns', () => ({
  isPast: vi.fn(),
  parseISO: vi.fn(),
  subMinutes: vi.fn()
}))

describe('#validateUserSession', () => {
  let mockRequest
  let mockSession
  let server
  let mockUserSession

  beforeEach(async () => {
    vi.clearAllMocks()

    mockRequest = {}

    mockSession = {
      sessionId: 'test-session-id'
    }

    mockUserSession = {
      sessionId: 'test-session-id',
      expiresAt: '2025-01-01T12:00:00.000Z',
      profile: { name: 'Test User' }
    }

    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })

    server = await startServer()
    mockRequest.server = server
  })

  afterEach(async () => {
    await server.stop({ timeout: 0 })
    getOidcConfig.mockReset()
  })

  test('should return false when there is no user session', async () => {
    authUtils.getUserSession.mockResolvedValue(null)
    const result = await validateUserSession(mockRequest, mockSession)
    expect(result).toEqual({ isValid: false })
  })

  test('should return valid user and user session', async () => {
    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    isPast.mockReturnValue(false)

    await server.app.cache.set(mockUserSession.sessionId, mockUserSession)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: true,
      credentials: mockUserSession
    })
  })

  test('should return false when user token is valid but no user session', async () => {
    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    isPast.mockReturnValue(false)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: false
    })
  })

  test('should return is valid: true when user token expires and token refresh succeeds', async () => {
    const mockRefreshResponse = {
      ok: true,
      json: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      }
    }

    const mockUpdatedSession = {
      sessionId: 'test-session-id',
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600000
    }

    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    authUtils.refreshAccessToken.mockResolvedValue(mockRefreshResponse)
    authUtils.updateUserSession.mockResolvedValue(mockUpdatedSession)
    isPast.mockReturnValue(true)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: true,
      credentials: mockUpdatedSession
    })
    expect(authUtils.refreshAccessToken).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.updateUserSession).toHaveBeenCalledWith(
      mockRequest,
      mockRefreshResponse.json
    )
  })

  test('should return is valid: false when user token expired and refresh fails', async () => {
    const mockRefreshResponse = {
      ok: false
    }

    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    authUtils.refreshAccessToken.mockResolvedValue(mockRefreshResponse)
    isPast.mockReturnValue(true)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({ isValid: false })
    expect(authUtils.refreshAccessToken).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.removeUserSession).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.updateUserSession).not.toHaveBeenCalled()
  })
})
