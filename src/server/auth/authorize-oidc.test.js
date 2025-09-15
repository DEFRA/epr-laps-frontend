import { createServer } from '../server.js'
import { setUserSession } from './utils.js'
import { authorizeOidcController } from './authorize-oidc.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')
vi.mock('./utils.js', () => ({
  setUserSession: vi.fn()
}))

describe('#authorizeOidcController', () => {
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

  test('should redirect users to auth page when user is not authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: false
      },
      logger: { info: vi.fn() },
      yar: { flash: vi.fn().mockReturnValue(['/get-help']) }
    }

    const mockedResponse = { redirect: vi.fn() }

    await authorizeOidcController.handler(mockRequest, mockedResponse)
    expect(mockedResponse.redirect).toHaveBeenCalledWith('/get-help')
  })

  test('should call setUserSession when user is authenticated', async () => {
    const mockRequest = {
      auth: {
        isAuthenticated: true
      },
      logger: { info: vi.fn() },
      yar: { flash: vi.fn().mockReturnValue(['/get-help']) }
    }

    const mockedResponse = { redirect: vi.fn() }

    await authorizeOidcController.handler(mockRequest, mockedResponse)

    expect(setUserSession).toHaveBeenCalledWith(mockRequest)
    expect(mockRequest.logger.info).toHaveBeenCalled()
  })

  test('should call request.yar.flash and redirect', async () => {
    const customRedirectRoute = '/some/custom/route'

    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue([customRedirectRoute]) }
    }

    const mockedResponse = { redirect: vi.fn() }

    await authorizeOidcController.handler(mockRequest, mockedResponse)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('referrer')
    expect(mockedResponse.redirect).toHaveBeenCalledWith(customRedirectRoute)
  })

  test('should fall back to / route when there is no referrer in flash', async () => {
    const mockRequest = {
      auth: { isAuthenticated: false },
      yar: { flash: vi.fn().mockReturnValue([]) }
    }

    const mockedResponse = { redirect: vi.fn() }

    await authorizeOidcController.handler(mockRequest, mockedResponse)

    expect(mockRequest.yar.flash).toHaveBeenCalledWith('referrer')
    expect(mockedResponse.redirect).toHaveBeenCalledWith('/')
  })
})
