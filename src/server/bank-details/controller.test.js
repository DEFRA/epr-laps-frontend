import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController
} from './controller.js'
import { fetchWithToken, putWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

// Mock dependencies
vi.mock('../../server/auth/utils.js')
vi.mock('../../config/nunjucks/context/context.js')

describe('#bankDetailsController', () => {
  let request
  let h
  let responseToolkit

  beforeEach(() => {
    request = {
      auth: { credentials: { organisationName: 'Test Local Authority' } },
      logger: { info: vi.fn(), error: vi.fn() },
      app: {}
    }

    responseToolkit = {
      code: vi.fn().mockReturnThis()
    }

    h = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn(() => responseToolkit)
    }

    context.mockResolvedValue({
      currentLang: 'en',
      translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
      bankApiData: {
        id: '123',
        accountName: 'Test Account',
        sortCode: '00-00-00',
        accountNumber: '12345678'
      }
    })

    fetchWithToken.mockResolvedValue({
      id: '123',
      accountName: 'Test Account',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })
    putWithToken.mockResolvedValue({ success: true })
  })

  it('should handle errors gracefully and log them', async () => {
    const error = new Error('API failure')
    fetchWithToken.mockRejectedValueOnce(error)

    await bankDetailsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      'Error fetching bank details:',
      error
    )
    expect(h.response).toHaveBeenCalledWith({
      error: 'Failed to fetch bank details'
    })
    expect(responseToolkit.code).toHaveBeenCalledWith(500)
  })
})

describe('#confirmBankDetailsController', () => {
  let mockRequest, mockH, mockViewReturn

  beforeEach(() => {
    mockViewReturn = 'rendered-view'

    mockH = {
      view: vi.fn(() => mockViewReturn)
    }

    mockRequest = {}

    vi.clearAllMocks()
  })

  it('should render view with context data', async () => {
    const contextData = {
      bankApiData: { accountNumber: '12345678', sortCode: '12-34-56' },
      translations: { 'local-authority': 'Local Authority' },
      currentLang: 'en'
    }
    context.mockResolvedValue(contextData)

    const result = await confirmBankDetailsController.handler(
      mockRequest,
      mockH
    )

    expect(context).toHaveBeenCalledWith(mockRequest)
    expect(mockH.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        translations: contextData.translations,
        currentLang: contextData.currentLang,
        bankApiData: contextData.bankApiData,
        isContinueEnabled: false
      })
    )
    expect(result).toBe(mockViewReturn)
  })
})

describe('#bankDetailsConfirmedController', () => {
  let request
  let h

  beforeEach(() => {
    request = {
      auth: { credentials: { organisationName: 'Test Local Authority' } },
      logger: { info: vi.fn(), error: vi.fn() },
      app: {}
    }

    h = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn(() => h)
    }
    h.response.code = vi.fn(() => h)
  })

  it('calls putWithToken with correct arguments and redirects on success', async () => {
    await bankDetailsConfirmedController.handler(request, h)

    expect(putWithToken).toHaveBeenCalledWith(
      request,
      'bank-details/Test%20Local%20Authority',
      expect.objectContaining({ confirmed: true })
    )
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-confirmed?lang=en'
    )
  })
})
