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

  beforeEach(() => {
    request = {
      auth: { credentials: { organisationName: 'Test Local Authority' } },
      logger: { info: vi.fn(), error: vi.fn() },
      app: {}
    }

    h = {
      view: vi.fn(),
      redirect: vi.fn(),
      response: vi.fn(() => ({
        code: vi.fn(() => ({}))
      }))
    }

    // Default mock for context
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

    // Default mocks for API calls
    fetchWithToken.mockResolvedValue({
      id: '123',
      accountName: 'Test Account',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })
    putWithToken.mockResolvedValue({ success: true })
  })

  it('should render view with API data for authenticated user', async () => {
    await bankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.objectContaining({
        pageTitle: 'Bank Details',
        currentLang: 'en',
        translations: expect.any(Object),
        apiData: expect.objectContaining({ accountName: 'Test Account' })
      })
    )
  })

  it('should fallback to empty translations and "en" for currentLang if missing', async () => {
    // Mock context to return undefined values
    context.mockResolvedValueOnce({
      translations: {},
      currentLang: 'en'
    })

    fetchWithToken.mockResolvedValueOnce({
      id: '123',
      accountName: 'Test Account',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })

    await bankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalled()

    const viewArgs = h.view.mock.calls[0][1]
    expect(viewArgs.translations).toEqual({})
    expect(viewArgs.currentLang).toBe('en')
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
