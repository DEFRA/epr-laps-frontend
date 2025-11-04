import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { signOutController } from './controller.js'
import { removeUserSession } from '../common/helpers/auth/utils.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

vi.mock('../common/helpers/auth/utils.js', () => ({
  removeUserSession: vi.fn(),
  getUserSession: vi.fn()
}))

describe('#signOutController', () => {
  let server
  let mockedResponse

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

  beforeEach(() => {
    mockedResponse = { view: vi.fn(), redirect: vi.fn() }
    vi.clearAllMocks()

    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user'
    })
  })

  test('should redirect user when user is unauthenticated', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      },
      yar: { set: vi.fn(), get: vi.fn() }
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    await signOutController.handler(mockRequest, mockedResponse)
    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('should provide expected response', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      },
      yar: { set: vi.fn(), get: vi.fn().mockReturnValue('en') }
    }

    await signOutController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith('sign-out/index.njk', {
      currentLang: 'en',
      translations: expect.any(Object)
    })
  })

  it('should call removeUserSession if userSession exists', async () => {
    const request = {
      state: { userSession: { userId: '123' } },
      auth: { credentials: { userId: '123' } },
      yar: { get: vi.fn().mockReturnValue('en'), set: vi.fn() }
    }

    await signOutController.handler(request, mockedResponse)

    expect(removeUserSession).toHaveBeenCalledWith(
      request,
      request.state.userSession
    )

    expect(mockedResponse.view).toHaveBeenCalledWith('sign-out/index.njk', {
      currentLang: 'en',
      translations: expect.any(Object)
    })
  })

  it('should not call removeUserSession if userSession is missing', async () => {
    const request = {
      state: {},
      yar: { get: vi.fn().mockReturnValue('en') }
    }

    await signOutController.handler(request, mockedResponse)

    expect(removeUserSession).not.toHaveBeenCalled()
    expect(mockedResponse.view).toHaveBeenCalledWith('sign-out/index.njk', {
      currentLang: 'en',
      translations: expect.any(Object)
    })
  })
})
