import { bankDetailsController } from './controller.js'
import { vi, describe, test, beforeEach, expect } from 'vitest'
import { statusCodes } from '../common/constants/status-codes.js'
import * as contextModule from '../../config/nunjucks/context/context.js'

// mock logger
const mockLoggerError = vi.fn()

// mock fetchWithToken
const mockFetchWithToken = vi.fn()

vi.mock('../../server/auth/utils.js', () => ({
  fetchWithToken: (...args) => mockFetchWithToken(...args)
}))

vi.mock('../../server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('#bankDetailsController', () => {
  const h = {
    view: vi.fn(),
    response: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(contextModule, 'context').mockResolvedValue({
      organisationName: 'Test LA'
    })
  })

  test('should return 401 if unauthorized error is thrown', async () => {
    mockFetchWithToken.mockRejectedValue(new Error('Unauthorized'))
    const request = { app: {} }
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
      }
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
})
