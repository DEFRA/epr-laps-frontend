import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController
} from './controller.js'
import * as authUtils from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

vi.mock('../../server/auth/utils.js', () => ({
  __esModule: true,
  fetchWithToken: vi.fn(),
  putWithToken: vi.fn()
}))

vi.mock('../../config/nunjucks/context/context.js', () => ({
  __esModule: true,
  context: vi.fn()
}))

const createH = () => ({
  view: vi.fn().mockReturnValue('view-rendered'),
  redirect: vi.fn().mockReturnValue('redirected'),
  response: vi.fn((payload) => ({
    payload,
    code: (statusCode) => statusCode
  }))
})

const createRequest = (overrides = {}) => ({
  auth: {
    credentials: {
      account: { localAuthorityName: 'Test Local Authority' },
      organisationName: 'Test Local Authority'
    }
  },
  logger: { error: vi.fn(), info: vi.fn() },
  ...overrides
})

describe('#bankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should successfully render the bank details view', async () => {
    context.mockResolvedValue({
      bankApiData: { sortCode: '00-00-00', accountNumber: '12345678' },
      translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
      currentLang: 'en'
    })

    const result = await bankDetailsController.handler(request, h)

    expect(context).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.any(Object)
    )
    expect(result).toBe('view-rendered')
  })

  it('should handle Unauthorized error separately', async () => {
    const unauthorizedError = new Error('Unauthorized')
    context.mockRejectedValue(unauthorizedError)

    const result = await bankDetailsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      'Error fetching bank details:',
      unauthorizedError
    )
    expect(result).toBe(401)
  })

  it('should handle generic errors gracefully', async () => {
    const genericError = new Error('Something went wrong')
    context.mockRejectedValue(genericError)

    const result = await bankDetailsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      'Error fetching bank details:',
      genericError
    )
    expect(result).toBe(500)
  })
})

describe('#confirmBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest({
      payload: { sortCode: '00-00-00', accountNumber: '12345678' }
    })
    vi.clearAllMocks()
  })

  it('should confirm bank details and render confirmation view', async () => {
    context.mockResolvedValue({
      bankApiData: {
        id: '123',
        accountName: 'Foo',
        sortCode: '00-00-00',
        accountNumber: '12345678'
      },
      translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
      currentLang: 'en'
    })

    const result = await confirmBankDetailsController.handler(request, h)

    expect(context).toHaveBeenCalledWith(request)
    expect(h.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.any(Object)
    )
    expect(result).toBe('view-rendered')
  })
})

describe('#bankDetailsConfirmedController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should confirm bank details via PUT and redirect', async () => {
    context.mockResolvedValue({
      bankApiData: {
        id: '123',
        accountName: 'Foo',
        sortCode: '00-00-00',
        accountNumber: '12345678'
      },
      translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
      currentLang: 'en'
    })
    authUtils.putWithToken.mockResolvedValue({ ok: true })

    const result = await bankDetailsConfirmedController.handler(request, h)

    expect(context).toHaveBeenCalledWith(request)
    expect(authUtils.putWithToken).toHaveBeenCalledWith(
      request,
      'bank-details/Test%20Local%20Authority',
      {
        id: '123',
        accountName: 'Foo',
        sortCode: '00-00-00',
        accountNumber: '12345678',
        confirmed: true
      }
    )
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-confirmed?lang=en'
    )
    expect(result).toBe('redirected')
  })
})
