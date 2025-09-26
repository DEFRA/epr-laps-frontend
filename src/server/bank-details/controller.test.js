import { bankDetailsController } from './controller.js'
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
