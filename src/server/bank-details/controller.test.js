import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsController,
  postBankDetailsController,
  checkBankDetailsController,
  updateBankDetailsInfoController,
  bankDetailsSubmittedController
} from './controller.js'
import Boom from '@hapi/boom'
import { postWithToken, putWithToken } from '../auth/utils.js'

vi.mock('../auth/utils.js', () => ({
  __esModule: true,
  fetchWithToken: vi.fn(),
  putWithToken: vi.fn(),
  postWithToken: vi.fn()
}))

const createH = () => ({
  view: vi.fn().mockReturnValue('view-rendered'),
  redirect: vi.fn().mockReturnValue('redirected'),
  response: vi.fn((payload) => {
    const res = { payload }
    res.code = (statusCode) => {
      res.statusCode = statusCode
      return res
    }
    return res
  })
})

const createRequest = (overrides = {}) => ({
  auth: {
    credentials: {
      account: { localAuthorityName: 'Defra Test' },
      organisationName: 'Defra Test'
    }
  },
  logger: { error: vi.fn(), info: vi.fn() },
  app: { currentLang: 'en', translations: { confirm: 'Confirm' } },
  yar: {
    get: vi.fn(),
    set: vi.fn(),
    clear: vi.fn()
  },
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
    request.yar.get.mockReturnValue({ id: 'i22', accountName: 'account-one' })

    const result = await bankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.any(Object)
    )
    expect(result).toBe('view-rendered')
  })

  it('should return error when bank details are not found in session', async () => {
    await expect(
      bankDetailsController.handler(request, h)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 500 }
    })
  })
})

describe('#confirmBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest({
      payload: { sortCode: '00-00-00', accountNumber: '12345678' },
      currentLang: 'en'
    })
    vi.clearAllMocks()
  })

  it('should render confirmation view', async () => {
    request.yar.get.mockReturnValue({
      id: '123',
      accountName: 'Foo',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })
    const result = await confirmBankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      {
        pageTitle: 'Confirm Bank Details',
        isContinueEnabled: false,
        bankApiData: {
          id: '123',
          accountName: 'Foo',
          sortCode: '00-00-00',
          accountNumber: '12345678'
        }
      }
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

  it('should handle putWithToken failure and return 500', async () => {
    request.app.translations = {
      'laps-home': 'Home',
      'bank-details': 'Bank Details'
    }
    request.app.currentLang = 'en'
    request.yar.get = vi.fn().mockReturnValue({
      id: '123',
      accountName: 'Foo',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })

    putWithToken.mockRejectedValue(
      Boom.internal('Failed to update bank details')
    )

    await expect(
      bankDetailsConfirmedController.handler(request, h)
    ).rejects.toMatchObject({
      isBoom: true,
      output: { statusCode: 500 }
    })
  })

  it('should redirect users to confirmation page successfully after confirmation', async () => {
    request.yar.get = vi.fn().mockReturnValue({
      id: '123',
      accountName: 'Foo',
      sortCode: '00-00-00',
      accountNumber: '12345678'
    })

    putWithToken.mockResolvedValue({
      success: true
    })

    await bankDetailsConfirmedController.handler(request, h)
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-confirmed?lang=en'
    )
    expect(request.logger.info).toHaveBeenCalled()
  })
})

describe('#updateBankDetailsInfoController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should render the update bank details view', () => {
    const result = updateBankDetailsInfoController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/update-bank-details-info.njk',
      { pageTitle: 'How it works' }
    )
    expect(result).toBe('view-rendered')
  })
})

describe('#updateBankDetailsController', () => {
  let h

  beforeEach(() => {
    // Mock h.view()
    h = {
      view: vi.fn().mockReturnThis()
    }
  })

  test('should render the update bank details view with correct page title', () => {
    updateBankDetailsController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/update-bank-details.njk',
      { pageTitle: 'Update Bank Details' }
    )
  })
})

describe('#checkBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should render the confirm bank details view with correct data', () => {
    const result = checkBankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/check-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm new bank account details',
        newBankDetails: expect.objectContaining({
          id: '12345-abcde-67890-fghij',
          accountNumber: '094785923',
          accountName: 'Defra Test',
          sortCode: '09-03-023',
          requestedBy: 'Juhi'
        })
      })
    )
    expect(result).toBe('view-rendered')
  })
})

describe('#postBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should call postWithToken, set session flag, and redirect on success', async () => {
    postWithToken.mockResolvedValue({})

    const result = await postBankDetailsController.handler(request, h)

    expect(postWithToken).toHaveBeenCalledWith(request, '/bank-details', {
      accountNumber: '094785923',
      accountName: 'Defra Test',
      sortCode: '09-03-023',
      requesterName: 'Juhi',
      localAuthority: 'Defra Test'
    })
    expect(request.yar.set).toHaveBeenCalledWith('bankDetailsSubmitted', true)
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-submitted?lang=en'
    )
    expect(result).toBe('redirected')
  })
})

describe('#bankDetailsSubmittedController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest()
    vi.clearAllMocks()
  })

  it('should render the submitted page when valid session flag exists', async () => {
    request.yar.get.mockReturnValue(true)

    const result = await bankDetailsSubmittedController.handler(request, h)

    expect(request.yar.get).toHaveBeenCalledWith('bankDetailsSubmitted')
    expect(request.yar.clear).toHaveBeenCalledWith('bankDetailsSubmitted')
    expect(h.view).toHaveBeenCalledWith(
      'bank-details/bank-details-submitted.njk',
      expect.objectContaining({
        pageTitle: 'Bank details submitted'
      })
    )
    expect(result).toBe('view-rendered')
  })

  it('should redirect to update info page when no valid session flag exists', async () => {
    request.yar.get.mockReturnValue(null)

    const result = await bankDetailsSubmittedController.handler(request, h)

    expect(request.yar.get).toHaveBeenCalledWith('bankDetailsSubmitted')
    expect(request.yar.clear).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/update-bank-details-info?lang=en'
    )
    expect(result).toBe('redirected')
  })
})
