import { createServer } from '../server'
import { getUserSession, removeUserSession } from '../common/helpers/auth/utils'
import { signOutController } from './sign-out'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')
vi.mock('../common/helpers/auth/utils', () => ({
  getUserSession: vi.fn(),
  removeUserSession: vi.fn()
}))

describe('#signOutController', () => {
  let server

  beforeAll(async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })

    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    getOidcConfig.mockReset()
    await server.stop({ timeout: 0 })
  })

  test('should redirect users to auth page when there is no authentication', async () => {
    getUserSession.mockReturnValueOnce(null)
    const mockedRequest = {
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const mockedResponse = { redirect: vi.fn() }

    await signOutController.handler(mockedRequest, mockedResponse)

    expect(mockedResponse.redirect).toHaveBeenCalledWith('/')
  })

  test('should call removeUserSession and redirect uri when user is authenticated', async () => {
    const mockedUserSession = {
      logoutUrl: 'testLogout',
      idToken: 'testId'
    }

    const mockedRequest = {
      auth: { credentials: { sessionId: 'testSessionId' } },
      headers: { referer: 'http://localhost:3000/' },
      logger: { info: vi.fn(), debug: vi.fn() }
    }

    const mockedResponse = { redirect: vi.fn() }

    getUserSession.mockReturnValueOnce(mockedUserSession)

    await signOutController.handler(mockedRequest, mockedResponse)
    expect(removeUserSession).toHaveBeenCalledWith(
      mockedRequest,
      mockedRequest.auth.credentials
    )
    expect(mockedResponse.redirect).toHaveBeenCalledWith(
      `testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000/logout`
    )
  })

  it('uses referer if present', async () => {
    const mockedUserSession = {
      logoutUrl: 'http://logout.example.com',
      idToken: 'testId'
    }

    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      headers: { referer: 'http://example.com/' },
      server: { info: { uri: 'http://localhost' } },
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }

    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      expect.stringContaining('http://example.com/')
    )
  })

  it('uses fallback if referer missing', async () => {
    const mockedUserSession = {
      logoutUrl: 'http://logout.example.com',
      idToken: 'testId'
    }

    getUserSession.mockReturnValueOnce(mockedUserSession)

    const request = {
      headers: {},
      server: { info: { uri: 'http://localhost' } },
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }

    const h = { redirect: vi.fn() }

    await signOutController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      expect.stringContaining('http://localhost')
    )
  })
})
