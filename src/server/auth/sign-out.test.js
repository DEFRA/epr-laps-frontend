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
      app: { currentLang: 'en' },
      auth: { credentials: {} },
      logger: { info: vi.fn(), debug: vi.fn() }
    }
    const mockedResponse = { redirect: vi.fn() }

    await signOutController.handler(mockedRequest, mockedResponse)

    expect(mockedResponse.redirect).toHaveBeenCalledWith('/')
  })

  test('should call removeUserSession and redirect uri when user is authenticated', async () => {
    const mockedUserSession = {
      app: { currentLang: 'en' },
      logoutUrl: 'testLogout',
      idToken: 'testId'
    }

    const mockedRequest = {
      app: { currentLang: 'en' },
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
      `testLogout?id_token_hint=testId&post_logout_redirect_uri=http://localhost:3000/logout?lang=en`
    )
  })
})
