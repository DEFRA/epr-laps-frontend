import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController
} from './controller.js'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { statusCodes } from '../common/constants/status-codes.js'

const mockLogger = { error: vi.fn(), info: vi.fn() }

// mock fetchWithToken
const mockFetchWithToken = vi.fn()

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: (...args) => mockFetchWithToken(...args)
}))

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

    // Mock h.view
    mockH = {
      view: vi.fn(() => mockViewReturn)
    }

    // Mock request
    mockRequest = {
      app: {
        translations: { 'local-authority': 'Local Authority' }
      },
      currentLang: 'en',
      state: {
        userSession: {
          sessionId: 'test-session-id'
        }
      },
      server: {
        app: {
          cache: {
            get: vi.fn()
          }
        }
      }
    }
  })

  it('should render view with apiData when present in session', async () => {
    const apiDataMock = { accountNumber: '12345678', sortCode: '12-34-56' }
    mockRequest.server.app.cache.get.mockResolvedValue({
      apiData: apiDataMock
    })

    const result = await confirmBankDetailsController.handler(
      mockRequest,
      mockH
    )

    expect(mockRequest.server.app.cache.get).toHaveBeenCalledWith(
      'test-session-id'
    )
    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        apiData: apiDataMock,
        translations: { 'local-authority': 'Local Authority' },
        currentLang: 'en'
      })
    )
    expect(result).toBe(mockViewReturn)
  })
})

describe('bankDetailsConfirmedController', () => {
  it('renders the correct view with default language', async () => {
    const mockH = {
      view: vi.fn().mockReturnValue('rendered')
    }
    const mockRequest = {
      app: {
        translations: { 'confirm-your-lo': 'Confirm your local authority' },
        currentLang: 'en'
      }
    }

    const result = await bankDetailsConfirmedController.handler(
      mockRequest,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledTimes(1)
    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/bank-details-confirmed.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        currentLang: 'en',
        translations: { 'confirm-your-lo': 'Confirm your local authority' }
      })
    )
    expect(result).toBe('rendered')
  })

  it('defaults currentLang to "en" if not set', async () => {
    const mockH = {
      view: vi.fn().mockReturnValue('rendered')
    }
    const mockRequest = {
      app: {
        translations: { 'confirm-your-lo': 'Confirm your local authority' }
      }
    }

    const result = await bankDetailsConfirmedController.handler(
      mockRequest,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/bank-details-confirmed.njk',
      expect.objectContaining({
        currentLang: 'en'
      })
    )
    expect(result).toBe('rendered')
  })

  it('uses the specified language if currentLang is set', async () => {
    const mockH = {
      view: vi.fn().mockReturnValue('rendered')
    }
    const mockRequest = {
      app: {
        translations: { 'confirm-your-lo': 'Confirmez votre autorité locale' },
        currentLang: 'fr'
      }
    }

    const result = await bankDetailsConfirmedController.handler(
      mockRequest,
      mockH
    )

    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/bank-details-confirmed.njk',
      expect.objectContaining({
        currentLang: 'fr',
        translations: { 'confirm-your-lo': 'Confirmez votre autorité locale' }
      })
    )
    expect(result).toBe('rendered')
  })
})
