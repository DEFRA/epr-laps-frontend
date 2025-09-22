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
        important: 'Important',
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
    const mockRequest = {}
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    await bankDetailsController.handler(mockRequest, mockedResponse)

    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('should render appropirate template when user is authenticated', async () => {
    const mockRequest = {}
    const mockedResponse = { view: vi.fn() }

    await bankDetailsController.handler(mockRequest, mockedResponse)
    expect(mockedResponse.view).toHaveBeenCalledWith('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        },
        {
          text: 'Bank details'
        }
      ]
    })
  })

  test('Should have translations and currentLang available', async () => {
    const { result } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    // Check that a translated string and currentLang are rendered
    expect(result).toContain('Bank details')
    expect(result).toMatch(/Your local authority('|&#39;)s bank details/)
    expect(result).toContain('en')
  })

  test('Should fall back to defaults when translations and currentLang are missing', async () => {
    // Remove translations + lang injection for this test
    server.ext('onRequest', (request, h) => {
      request.app = {} // nothing set
      return h.continue
    })

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    expect(statusCode).toBe(statusCodes.ok)

    expect(result).toContain('Bank Details')

    // fallback `currentLang = 'en'`
    expect(result).toContain('en')
  })
})
