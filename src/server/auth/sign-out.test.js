import { signOutController } from './sign-out'
import { getUserSession, removeUserSession } from '../common/helpers/auth/utils'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn((key) =>
      key === 'defraId.redirectUrl' ? 'http://fallback-url/' : ''
    )
  }
}))

// Mock logger options to avoid Pino errors
vi.mock('../common/helpers/logging/logger-options.js', () => ({
  loggerOptions: { level: 'info', redact: [] }
}))

vi.mock('../common/helpers/auth/utils', () => ({
  getUserSession: vi.fn(),
  removeUserSession: vi.fn()
}))

vi.mock('../common/helpers/auth/get-oidc-config.js')

describe('#signOutController', () => {
  afterEach(() => vi.clearAllMocks())

  beforeAll(() => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })
  })

  test('redirects to / when no authentication', async () => {
    getUserSession.mockReturnValueOnce(null)
    const request = {
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/')
  })

  test('removes session and redirects when authenticated', async () => {
    const mockedUserSession = { logoutUrl: 'testLogout', idToken: 'testId' }
    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      auth: { credentials: { sessionId: 'abc' } },
      headers: { referer: 'http://localhost:3000/' },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(removeUserSession).toHaveBeenCalledWith(
      request,
      request.auth.credentials
    )
    expect(h.redirect).toHaveBeenCalledWith(
      'testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000/logout'
    )
  })

  test('uses referer if present', async () => {
    const mockedUserSession = {
      logoutUrl: 'http://logout.example.com',
      idToken: 'testId'
    }
    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      headers: { referer: 'http://example.com/' },
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      expect.stringContaining('http://example.com/')
    )
  })

  test('redirects to fallback URL when referer is missing', async () => {
    const mockedUserSession = {
      logoutUrl: 'http://logout.example.com',
      idToken: 'testId'
    }
    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      headers: {},
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      expect.stringContaining('http://fallback-url/')
    )
  })

  test('handles referrer without trailing slash', async () => {
    const mockedUserSession = { logoutUrl: 'testLogout', idToken: 'testId' }
    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      headers: { referer: 'http://localhost:3000' }, // no trailing slash
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      'testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000/logout'
    )
  })
})
