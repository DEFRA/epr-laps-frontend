import { homeController } from './controller.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { fetchWithToken } from '../auth/utils.js'
import Boom from '@hapi/boom'

// Mock fetchWithToken if used in controller
vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

describe('#homeController', () => {
  let mockRequest
  let mockedResponse

  beforeEach(() => {
    vi.clearAllMocks()

    // Spy on getUserSession if controller uses it
    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user',
      organisationName: 'Mocked Organisation'
    })

    mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

    mockRequest = {
      app: {
        currentLang: 'en',
        translations: {
          'local-authority': 'Mocked Local Authority'
        }
      },
      auth: { credentials: {} },
      state: { userSession: { sessionId: 'test-session-id' } },
      server: {
        app: {
          cache: {
            get: vi.fn().mockResolvedValue({}),
            set: vi.fn().mockResolvedValue()
          }
        }
      },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
      yar: {
        get: vi.fn(),
        set: vi.fn()
      }
    }
  })

  test('should render view with translations', async () => {
    mockRequest.yar.get = vi.fn().mockReturnValue({
      viewFullBankDetails: true
    })
    await homeController.handler(mockRequest, mockedResponse)
    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        breadcrumbs: [{ text: 'Mocked Local Authority', href: '/?lang=en' }]
      })
    )
  })

  test('should call fetch when permissions are not found', async () => {
    mockRequest.yar.get = vi.fn().mockReturnValue(null)
    await homeController.handler(mockRequest, mockedResponse)
    expect(fetchWithToken).toHaveBeenNthCalledWith(
      1,
      mockRequest,
      '/permissions/config'
    )
    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        breadcrumbs: [{ text: 'Mocked Local Authority', href: '/?lang=en' }]
      })
    )
  })

  test('should respond with error when there is failure to call backend service', async () => {
    mockRequest.yar.get = vi.fn().mockReturnValue({
      viewFullBankDetails: true
    })
    fetchWithToken.mockRejectedValue(Boom.internal('Failed to fetch data'))

    await expect(
      homeController.handler(mockRequest, mockedResponse)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 500 }
    })
  })
})
