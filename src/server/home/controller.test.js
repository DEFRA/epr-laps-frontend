import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { homeController } from './controller.js'
import * as contextModule from '../../config/nunjucks/context/context.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

vi.mock('../../config/nunjucks/context/context.js', () => ({
  context: vi.fn()
}))

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

describe('#homeController', () => {
  let server

  beforeAll(async () => {
    vi.mocked(contextModule.context).mockResolvedValue({
      authedUser: {
        currentRole: 'Finance',
        organisationName: 'Mocked Organisation'
      }
    })

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
    const mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

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
    const mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        currentLang: 'en',
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

  test('should handle missing translations and currentLang', async () => {
    vi.mocked(contextModule.context).mockRejectedValue(new Error('Failed'))

    const mockRequest = { app: {}, state: {} }
    const mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.response).toHaveBeenCalledWith({
      error: 'Failed to fetch bank details'
    })

    const responseObj = mockedResponse.response.mock.results[0].value
    expect(responseObj.code).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })

  test('should fetch bank details when roleName is Head of Finance', async () => {
    vi.mocked(contextModule.context).mockResolvedValue({
      authedUser: {
        currentRole: 'Head of Finance',
        organisationName: 'Mocked Organisation'
      }
    })

    const apiData = { bankName: 'Test Bank' }
    vi.mocked(fetchWithToken).mockResolvedValue(apiData)

    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      },
      state: { userSession: { sessionId: 'mock-session' } },
      server: { app: { cache: { get: vi.fn().mockResolvedValue({}) } } }
    }

    const mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

    // act
    await homeController.handler(mockRequest, mockedResponse)

    // assert: fetchWithToken was called with encoded organisation
    expect(fetchWithToken).toHaveBeenCalledWith(
      mockRequest,
      `/bank-details/${encodeURIComponent('Mocked Organisation')}`
    )

    // assert: payload ends up in apiData
    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        apiData
      })
    )
  })
})
