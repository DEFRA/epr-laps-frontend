import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { homeController } from './controller.js'
import * as authUtils from '../common/helpers/auth/utils.js'

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

describe('#homeController', () => {
  let mockRequest
  let mockedResponse

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock getUserSession
    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user',
      organisationName: 'Mocked Organisation'
    })

    // Common mocked response object
    mockedResponse = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn().mockImplementation(() => ({
        code: vi.fn().mockReturnThis()
      }))
    }

    // Default request
    mockRequest = {
      app: {},
      auth: { credentials: {} },
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
    }
  })

  test('should respond with error when fetchWithToken throws (unauthenticated users)', async () => {
    // Force fetchWithToken to throw
    vi.mocked(fetchWithToken).mockRejectedValue(new Error('Some error'))

    // Set role to trigger fetch
    mockRequest.auth.credentials.currentRole = 'Head of Finance'
    mockRequest.auth.credentials.organisationName = 'Mocked Organisation'

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.response).toHaveBeenCalledWith({
      error: 'Failed to fetch bank details'
    })

    const responseObj = mockedResponse.response.mock.results[0].value
    expect(responseObj.code).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })

  test('Should provide expected response with translations', async () => {
    mockRequest.app = {
      translations: { 'local-authority': 'Mocked Local Authority' },
      currentLang: 'en'
    }

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        currentLang: 'en',
        breadcrumbs: [{ text: 'Mocked Local Authority', href: '/?lang=en' }],
        translations: { 'local-authority': 'Mocked Local Authority' },
        apiData: null
      })
    )
  })

  test('should handle missing translations and currentLang', async () => {
    // No translations or currentLang
    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        currentLang: 'en',
        translations: {},
        breadcrumbs: [{ text: undefined, href: '/?lang=en' }],
        apiData: null
      })
    )
  })

  test('should fetch bank details when roleName is Head of Finance', async () => {
    const apiData = { bankName: 'Test Bank' }
    vi.mocked(fetchWithToken).mockResolvedValue(apiData)

    mockRequest.app = {
      translations: { 'local-authority': 'Mocked Local Authority' },
      currentLang: 'en'
    }
    mockRequest.auth.credentials = {
      currentRole: 'Head of Finance',
      organisationName: 'Mocked Organisation'
    }

    await homeController.handler(mockRequest, mockedResponse)

    expect(fetchWithToken).toHaveBeenCalledWith(
      mockRequest,
      `/bank-details/${encodeURIComponent('Mocked Organisation')}`
    )

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'home/index',
      expect.objectContaining({
        pageTitle: 'Home',
        apiData
      })
    )
  })
})
