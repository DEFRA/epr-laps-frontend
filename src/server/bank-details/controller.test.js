// src/server/bank-details/controller.test.js
import { bankDetailsController } from './controller.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

// Mock modules
vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn(),
}))
vi.mock('../../config/nunjucks/context/context.js', () => ({
  context: vi.fn(),
}))

// Inline status codes
const statusCodes = { unauthorized: 401, internalServerError: 500 }

describe('#bankDetailsController', () => {
  let request
  let h
  const mockContext = { organisationName: 'Glamshire County Council' }

  beforeEach(() => {
    vi.clearAllMocks()

    request = {
      app: {
        translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
        currentLang: 'en',
      },
    }

    h = {
      response: vi.fn().mockReturnThis(),
      code: vi.fn().mockReturnThis(),
      view: vi.fn(),
    }

    // Mock context to resolve to mockContext
    vi.mocked(context).mockResolvedValue(mockContext)
  })

  it('should return 401 if unauthorized error is thrown', async () => {
    fetchWithToken.mockImplementation(() => {
      const error = new Error('Unauthorized')
      throw error
    })

    await bankDetailsController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(h.code).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  it('should render view with API data for authenticated user', async () => {
    const apiData = { bank: 'data' }
    fetchWithToken.mockResolvedValue(apiData)

    await bankDetailsController.handler(request, h)

    const expectedPath = `/bank-details/${encodeURIComponent(mockContext.organisationName)}`

    expect(fetchWithToken).toHaveBeenCalledWith(request, expectedPath)
    expect(h.view).toHaveBeenCalledWith('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      currentLang: 'en',
      translations: request.app.translations,
      breadcrumbs: [
        { text: 'Home', href: '/?lang=en' },
        { text: 'Bank Details', href: '/bank-details?lang=en' },
      ],
      apiData,
    })
  })

  it('should fallback to empty translations and en for currentLang', async () => {
    const emptyRequest = { app: {} }
    const apiData = {}
    fetchWithToken.mockResolvedValue(apiData)
    vi.mocked(context).mockResolvedValue({ organisationName: 'Glamshire County Council' })

    await bankDetailsController.handler(emptyRequest, h)

    expect(h.view).toHaveBeenCalledWith('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      currentLang: 'en',
      translations: {},
      breadcrumbs: [
        { text: undefined, href: '/?lang=en' },
        { text: undefined, href: '/bank-details?lang=en' },
      ],
      apiData,
    })
  })
})
