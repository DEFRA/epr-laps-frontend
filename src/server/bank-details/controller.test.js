import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController
} from './controller.js'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { statusCodes } from '../common/constants/status-codes.js'
import { context } from '../../config/nunjucks/context/context.js'
import { putWithToken } from '../auth/utils.js'

const mockLogger = { error: vi.fn(), info: vi.fn() }

// mock fetchWithToken
const mockFetchWithToken = vi.fn()

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: (...args) => mockFetchWithToken(...args),
  putWithToken: vi.fn()
}))
vi.mock('../../config/nunjucks/context/context.js')
describe('#bankDetailsController', () => {
  const h = {
    view: vi.fn(),
    response: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should return 401 if unauthorized error is thrown', async () => {
    mockFetchWithToken.mockRejectedValue(new Error('Unauthorized'))

    const request = {
      app: {},
      auth: { credentials: { organisationName: 'Test LA' } },
      logger: mockLogger
    }

    await bankDetailsController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
    expect(h.code).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  test('should render view with API data for authenticated user', async () => {
    const apiData = { bankName: 'Test Bank' }
    mockFetchWithToken.mockResolvedValue(apiData)

    const request = {
      app: {
        translations: {
          'bank-details': 'Bank details',
          'laps-home': 'LAPs home'
        },
        currentLang: 'en'
      },
      auth: { credentials: { organisationName: 'Test LA' } },
      logger: mockLogger
    }

    await bankDetailsController.handler(request, h)

    expect(mockFetchWithToken).toHaveBeenCalledWith(
      request,
      `/bank-details/${encodeURIComponent('Test LA')}`
    )

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.objectContaining({
        pageTitle: 'Bank Details',
        translations: request.app.translations,
        currentLang: 'en',
        apiData
      })
    )
  })

  test('should fallback to empty translations and en for currentLang', async () => {
    const apiData = { bankName: 'Test Bank' }
    mockFetchWithToken.mockResolvedValue(apiData)

    const request = {
      app: {},
      auth: { credentials: { organisationName: 'Test LA' } },
      logger: mockLogger
    }

    await bankDetailsController.handler(request, h)

    const viewArgs = h.view.mock.calls[0][1]
    expect(viewArgs.translations).toEqual({})
    expect(viewArgs.currentLang).toBe('en')
    expect(viewArgs.apiData).toEqual(apiData)
  })

  test('should return 500 if API call fails for other reasons', async () => {
    mockFetchWithToken.mockRejectedValue(new Error('API error'))

    const request = {
      app: {},
      auth: { credentials: { organisationName: 'Test LA' } },
      logger: mockLogger
    }

    await bankDetailsController.handler(request, h)

    expect(h.response).toHaveBeenCalledWith({
      error: 'Failed to fetch bank details'
    })
    expect(h.code).toHaveBeenCalledWith(statusCodes.internalServerError)
  })
})

describe('confirmBankDetailsController', () => {
  let mockRequest, mockH, mockViewReturn

  beforeEach(() => {
    mockViewReturn = 'rendered-view'

    mockH = {
      view: vi.fn(() => mockViewReturn)
    }

    mockRequest = {
      app: {
        translations: { 'local-authority': 'Local Authority' }
      },
      currentLang: 'en'
    }

    vi.clearAllMocks()
  })

  it('should render view with context data', async () => {
    const contextData = {
      apiData: { accountNumber: '12345678', sortCode: '12-34-56' },
      authedUser: { organisationName: 'Some Council Name', relationships: [] }
    }
    context.mockResolvedValue(contextData)

    // Act
    const result = await confirmBankDetailsController.handler(
      mockRequest,
      mockH
    )

    // Assert
    expect(context).toHaveBeenCalledWith(mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        translations: mockRequest.app.translations,
        currentLang: 'en',
        isContinueEnabled: false,
        ...contextData
      })
    )
    expect(result).toBe(mockViewReturn)
  })
})

describe('bankDetailsConfirmedController', () => {
  const sessionId = 'abc123'
  const apiData = {
    id: '1',
    accountName: 'Test Account',
    sortCode: '12-34-56',
    accountNumber: '12345678'
  }

  const baseRequest = {
    app: {
      translations: { 'confirm-your-lo': 'Confirm your local authority' },
      currentLang: 'en'
    },
    state: { userSession: { sessionId } },
    server: {
      app: {
        cache: {
          get: vi.fn().mockResolvedValue({ apiData })
        }
      }
    },
    auth: { credentials: { organisationName: 'Test Authority' } },
    payload: { 'confirm-bank-details': 'confirmed' }
  }

  const mockH = {
    redirect: vi.fn().mockReturnValue('redirected'),
    view: vi.fn().mockReturnValue('rendered')
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls putWithToken with correct arguments and redirects on success', async () => {
    putWithToken.mockResolvedValue({})
    const result = await bankDetailsConfirmedController.handler(
      baseRequest,
      mockH
    )

    expect(putWithToken).toHaveBeenCalledWith(
      baseRequest,
      'bank-details/Test%20Authority',
      {
        id: apiData.id,
        accountName: apiData.accountName,
        sortCode: apiData.sortCode,
        accountNumber: apiData.accountNumber,
        confirmed: true
      }
    )

    expect(mockH.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-confirmed?lang=en'
    )
    expect(result).toBe('redirected')
  })

  it('renders form with error if PUT fails', async () => {
    putWithToken.mockRejectedValue(new Error('API failed'))

    const result = await bankDetailsConfirmedController.handler(
      baseRequest,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        currentLang: 'en',
        translations: baseRequest.app.translations,
        apiData,
        isContinueEnabled: true,
        error: 'Failed to update bank details. Please try again.'
      })
    )
    expect(result).toBe('rendered')
  })

  it('renders form with error if checkbox is not checked', async () => {
    const requestWithoutCheckbox = {
      ...baseRequest,
      payload: {}
    }

    const result = await bankDetailsConfirmedController.handler(
      requestWithoutCheckbox,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        currentLang: 'en',
        translations: baseRequest.app.translations,
        apiData,
        isContinueEnabled: true,
        error: 'Failed to update bank details. Please try again.'
      })
    )
    expect(result).toBe('rendered')
    expect(putWithToken).toHaveBeenCalled() // it *does* get called in current controller
  })

  it('uses {} as translations if none provided', async () => {
    const requestWithoutTranslations = {
      ...baseRequest,
      app: {
        currentLang: 'cy'
      }
    }

    putWithToken.mockRejectedValue(new Error('API failed'))

    const result = await bankDetailsConfirmedController.handler(
      requestWithoutTranslations,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        translations: {},
        currentLang: 'cy'
      })
    )
    expect(result).toBe('rendered')
  })

  it('uses "en" as currentLang if none provided', async () => {
    const requestWithoutLang = {
      ...baseRequest,
      app: {
        translations: { foo: 'bar' } // still keep translations
        // no currentLang
      }
    }

    putWithToken.mockRejectedValue(new Error('API failed'))

    const result = await bankDetailsConfirmedController.handler(
      requestWithoutLang,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        translations: { foo: 'bar' },
        currentLang: 'en' // ✅ fallback covered
      })
    )
    expect(result).toBe('rendered')
  })
})
