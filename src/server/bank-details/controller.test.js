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
})
