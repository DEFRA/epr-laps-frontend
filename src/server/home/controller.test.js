import { statusCodes } from '../common/constants/status-codes.js'
import { homeController } from './controller.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import * as contextModule from '../../config/nunjucks/context/context.js'

// Mock fetchWithToken
vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

// Spy on context
vi.spyOn(contextModule, 'context').mockResolvedValue({ apiData: null })

describe('#homeController', () => {
  let mockRequest
  let mockedResponse

  beforeEach(() => {
    vi.clearAllMocks()

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
      app: {},
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
      logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
    }
  })

  test('should render view with translations', async () => {
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
        translations: { 'local-authority': 'Mocked Local Authority' },
        breadcrumbs: [{ text: 'Mocked Local Authority', href: '/?lang=en' }],
        apiData: null
      })
    )
  })

  test('should handle missing translations and currentLang', async () => {
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

  test('should respond with error when context throws', async () => {
    vi.spyOn(contextModule, 'context').mockRejectedValueOnce(
      new Error('Some error')
    )

    await homeController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.response).toHaveBeenCalledWith({
      error: 'Failed to render home page'
    })

    const responseObj = mockedResponse.response.mock.results[0].value
    expect(responseObj.code).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })
})
