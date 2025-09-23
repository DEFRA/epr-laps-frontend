import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import { bankDetailsController } from './controller.js'
import * as authUtils from '../common/helpers/auth/utils.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')
describe('#bankDetailsController', () => {
  let server

  beforeAll(async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })
    server = await createServer()

    server.ext('onRequest', (request, h) => {
      request.app.translations = {
        'bank-details': 'Bank details',
        'the-nominated-h': 'Notification heading',
        'your-local': "Your local authority's bank details",
        'laps-home': 'Local Authority Payments (LAPs) home'
      }
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
      userName: 'test user'
    })
    vi.clearAllMocks()
  })

  test('should redirect user when user is unauthenticated', async () => {
    const mockRequest = {
      app: { translations: {}, currentLang: 'en' },
      state: { userSession: null }
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    await bankDetailsController.handler(mockRequest, mockedResponse)

    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('should render appropirate template when user is authenticated', async () => {
    const mockRequest = {
      app: {
        translations: {
          'bank-details': 'Bank details',
          'laps-home': 'Local Authority Payments (LAPs) home',
          'your-local': "Your local authority's bank details"
        },
        currentLang: 'en'
      },
      state: { userSession: { userName: 'test user' } }
    }

    const h = { redirect: vi.fn(), view: vi.fn() }
    await bankDetailsController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/?lang=en'
        },
        {
          text: 'Bank details',
          href: '/bank-details?lang=en'
        }
      ],
      currentLang: 'en',
      translations: {
        'bank-details': 'Bank details',
        'laps-home': 'Local Authority Payments (LAPs) home',
        'your-local': "Your local authority's bank details"
      },
      isConfirmed: false
    })
  })

  test('Should have translations and currentLang available', async () => {
    const mockRequest = {
      app: {
        translations: {
          'bank-details': 'Bank details',
          'laps-home': 'Local Authority Payments (LAPs) home',
          'your-local': "Your local authority's bank details"
        },
        currentLang: 'en'
      },
      state: { userSession: { userName: 'test user' } }
    }

    const h = { view: vi.fn() }

    await bankDetailsController.handler(mockRequest, h)

    const callArgs = h.view.mock.calls[0][1]
    expect(callArgs.translations['bank-details']).toBe('Bank details')
    expect(callArgs.currentLang).toBe('en')
  })
})

test('Should fall back to defaults when translations and currentLang are missing', async () => {
  const mockRequest = {
    app: {}, // no translations or currentLang
    state: { userSession: { userName: 'test user' } }
  }
  const h = { view: vi.fn() }

  await bankDetailsController.handler(mockRequest, h)

  const callArgs = h.view.mock.calls[0][1]
  expect(callArgs.translations).toEqual({})
  expect(callArgs.currentLang).toBe('en')
})
