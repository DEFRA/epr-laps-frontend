import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { homeController } from './controller.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })
    server = await createServer()

    server.ext('onRequest', (request, h) => {
      request.app.translations = { 'local-authority': 'Mocked Local Authority' }
      request.app.currentLang = 'en'
      return h.continue
    })

    await server.initialize()
  })

  afterAll(async () => {
    getOidcConfig.mockReset()
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user',
      organisationName: 'Mocked Organisation'
    })
    vi.clearAllMocks()
  })

  test('should redirect user when user is unauthenticated', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      },
      state: { userSession: null }
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    await homeController.handler(mockRequest, mockedResponse)
    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('Should provide expected response', async () => {
    const mockCacheGet = vi.fn().mockResolvedValue({
      sessionId: 'mock-session',
      organisationName: 'Mocked Organisation'
    })
    const mockRequest = {
      app: { currentLang: 'en' },
      state: { userSession: { sessionId: 'mock-session' } },
      server: {
        app: { cache: { get: mockCacheGet } }
      }
    }
    const mockedResponse = { view: vi.fn() }

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        currentLang: 'en',
        heading: 'Mocked Organisation',
        breadcrumbs: [
          {
            text: undefined,
            href: '/?lang=en'
          }
        ],
        translations: {}
      })
    )
  })
})
