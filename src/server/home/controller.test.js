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
      userName: 'test user'
    })
    vi.clearAllMocks()
  })

  test('should redirect user when user is unauthenticated', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      }
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
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      }
    }
    const mockedResponse = { view: vi.fn() }

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith('home/index', {
      pageTitle: 'Home',
      heading: 'Mocked Local Authority',
      currentLang: 'en',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        }
      ]
    })
  })
})
