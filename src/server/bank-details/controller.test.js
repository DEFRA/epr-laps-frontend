import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  postBankDetailsController,
  checkBankDetailsController,
  updateBankDetailsInfoController,
  getUpdateBankDetailsController,
  postUpdateBankDetailsController,
  bankDetailsSubmittedController,
  translateBankDetails
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
  app: {
    currentLang: 'en',
    translations: {
      confirm: 'Confirm'
    }
  },
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

  it('should translate sort code and account number correctly', () => {
    const translations = { 'ending-with': 'terminando con' }

    expect(translateBankDetails('ending with 22', translations)).toBe(
      'terminando con 22'
    )
    expect(translateBankDetails(' 12-33-22 ', translations)).toBe('12-33-22')
    expect(translateBankDetails(null, translations)).toBe('')
  })

  it('should correctly render when sort code is in dashed format (e.g. 22-44-44)', async () => {
    request.app.translations = {
      'laps-home': 'Home',
      'bank-details': 'Bank Details',
      'ending-with': 'ending with (translated)'
    }

    request.yar.get.mockReturnValue({
      id: '999',
      sortCode: '22-44-44',
      accountNumber: '12345678'
    })

    const result = await bankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.translatedSortCode).toBe('22-44-44')
    expect(context.translatedAccountNumber).toBe('12345678')
    expect(result).toBe('view-rendered')
  })

  it('should clear bankDetailsSubmitted when session flag exists', async () => {
    request.yar.get.mockReturnValue(true)
    request.yar.get.mockReturnValueOnce({ id: 'test', accountName: 'acc' })

    const result = await bankDetailsController.handler(request, h)

    expect(request.yar.clear).toHaveBeenCalledWith('bankDetailsSubmitted')
    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.any(Object)
    )
    expect(result).toBe('view-rendered')
  })
})

describe('translateBankDetails', () => {
  const translations = { 'ending-with': 'ending with (translated)' }

  it('returns empty string for falsy or non-string input', () => {
    expect(translateBankDetails(null, translations)).toBe('')
    expect(translateBankDetails(undefined, translations)).toBe('')
    expect(translateBankDetails(12345678, translations)).toBe('')
  })

  it('returns trimmed value if "ending with" not present', () => {
    expect(translateBankDetails(' 12-33-22 ', translations)).toBe('12-33-22')
  })

  it('replaces "ending with" with translation', () => {
    const value = 'Sort code ending with 22'
    const result = translateBankDetails(value, translations)
    expect(result).toBe('Sort code ending with (translated) 22')
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
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        isContinueEnabled: false,
        bankApiData: {
          id: '123',
          accountName: 'Foo',
          sortCode: '00-00-00',
          accountNumber: '12345678'
        },
        translatedSortCode: '00-00-00',
        translatedAccountNumber: '12345678'
      })
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
  let h, yar, request

  beforeEach(() => {
    h = {
      view: vi.fn(() => ({
        value: 'view-rendered',
        takeover: vi.fn().mockReturnValue({ value: 'view-rendered' })
      })),
      redirect: vi.fn((url) => url)
    }

    yar = {
      store: {},
      get: vi.fn(function (key) {
        return this.store[key]
      }),
      set: vi.fn(function (key, value) {
        this.store[key] = value
      }),
      clear: vi.fn(function (key) {
        delete this.store[key]
      })
    }

    request = {
      query: {},
      headers: {},
      path: '/update-bank-details',
      payload: {},
      yar,
      app: {
        currentLang: 'en',
        translations: {
          accountName: 'Enter account name',
          sortCodeEmpty: 'Enter the sort code',
          sortCodePattern: 'Enter a valid sort code like 309430',
          sortCodeLength: 'Sort code must be 6 digits long',
          accountNumberEmpty: 'Enter the account number',
          accountNumberDigits: 'Enter a valid account number like 12345678',
          accountNumberMin: 'Account number must be at least 6 digits long',
          accountNumberMax: 'Account number must be no more than 8 digits long'
        }
      }
    }
  })

  it('renders the update bank details page with empty form', async () => {
    const result = await getUpdateBankDetailsController.handler(request, h)
    const [template, contextData] = h.view.mock.calls[0]

    expect(template).toBe('bank-details/update-bank-details.njk')
    expect(contextData.pageTitle).toBe('Update Bank Details')
    expect(contextData.errors).toEqual({})
    expect(result.value).toBe('view-rendered')
  })

  it('revalidates payload on GET when formSubmitted is true', async () => {
    yar.set('payload', { accountName: '', sortCode: '', accountNumber: '' })
    yar.set('formSubmitted', true)
    request.headers.referer = request.path

    const result = await getUpdateBankDetailsController.handler(request, h)
    const [, contextData] = h.view.mock.calls[0]

    expect(contextData.errors).toBeTypeOf('object')
    expect(Array.isArray(contextData.aggregatedErrors)).toBe(true)
    expect(result.value).toBe('view-rendered')
  })

  it('renders validation errors when payload invalid on GET', async () => {
    yar.set('payload', { accountName: '', sortCode: '', accountNumber: '' })
    yar.set('formSubmitted', true)

    const result = await getUpdateBankDetailsController.handler(request, h)
    const [, contextData] = h.view.mock.calls[0]

    expect(contextData.errors).toBeTypeOf('object')
    expect(Array.isArray(contextData.aggregatedErrors)).toBe(true)
    expect(result.value).toBe('view-rendered')
  })

  it('renders validation errors when payload invalid on POST', async () => {
    request.payload = { accountName: '', sortCode: '', accountNumber: '' }

    const result = await postUpdateBankDetailsController.handler(request, h)
    const [template, contextData] = h.view.mock.calls[0]

    expect(template).toBe('bank-details/update-bank-details.njk')
    expect(contextData.payload).toEqual(request.payload)
    expect(contextData.errors).toBeTypeOf('object')
    expect(Array.isArray(contextData.aggregatedErrors)).toBe(true)
    expect(result.value).toBe('view-rendered')
  })

  it('redirects to check-bank-details when payload is valid', async () => {
    request.payload = {
      accountName: 'Test Account',
      sortCode: '123456',
      accountNumber: '12345678'
    }

    const result = await postUpdateBankDetailsController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      'bank-details/check-bank-details?lang=en'
    )
    expect(result).toBe('bank-details/check-bank-details?lang=en')
  })
})

describe('#checkBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest({
      auth: {
        credentials: {
          displayName: 'XYZ',
          organisationName: 'Defra Test'
        }
      },
      yar: {
        get: vi.fn().mockImplementation((key) => {
          if (key === 'payload') {
            return {
              id: '12345-abcde-67890-fghij',
              accountNumber: '094785923',
              accountName: 'Defra Test',
              sortCode: '09-03-023'
            }
          }
        }),
        set: vi.fn()
      }
    })
    vi.clearAllMocks()
  })

  it('should render the confirm bank details view with correct data', () => {
    const result = checkBankDetailsController.handler(request, h)

    expect(request.yar.get).toHaveBeenCalledWith('payload')
    expect(request.yar.set).toHaveBeenCalledWith(
      'ConfirmedBankDetails',
      expect.objectContaining({
        id: '12345-abcde-67890-fghij',
        accountNumber: '094785923',
        accountName: 'Defra Test',
        sortCode: '09-03-023',
        localAuthority: 'Defra Test'
      })
    )

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/check-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm new bank account details',
        newBankDetails: expect.objectContaining({
          localAuthority: 'Defra Test'
        })
      })
    )
    expect(result).toBe('view-rendered')
  })

  it('should redirect to /update-bank-details if payload is missing', () => {
    request.yar.get = vi.fn().mockReturnValue(undefined)

    const result = checkBankDetailsController.handler(request, h)

    expect(request.yar.get).toHaveBeenCalledWith('payload')
    expect(h.redirect).toHaveBeenCalledWith('bank-details/update-bank-details')
    expect(result).toBe('redirected')
  })
})

describe('#postBankDetailsController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = createRequest({
      app: { currentLang: 'en' },
      auth: {
        credentials: {
          displayName: 'Juhi',
          organisationName: 'Defra Test'
        }
      },
      yar: {
        get: vi.fn((key) => {
          if (key === 'ConfirmedBankDetails') {
            return {
              accountNumber: '094785923',
              accountName: 'Defra Test',
              sortCode: '09-03-023',
              localAuthority: 'Defra Test'
            }
          }
        }),
        set: vi.fn(),
        clear: vi.fn()
      },
      logger: { info: vi.fn() }
    })

    vi.clearAllMocks()
  })

  it('should call postWithToken, set session flag, clear session, and redirect on success', async () => {
    postWithToken.mockResolvedValue({})

    const result = await postBankDetailsController.handler(request, h)

    expect(postWithToken).toHaveBeenCalledWith(request, '/bank-details', {
      accountNumber: '094785923',
      accountName: 'Defra Test',
      sortCode: '0903023',
      localAuthority: 'Defra Test'
    })
    expect(request.logger.info).toHaveBeenCalledWith(
      expect.stringContaining(
        'Bank details successfully posted for organisation'
      )
    )
    expect(request.yar.set).toHaveBeenCalledWith('bankDetailsSubmitted', true)
    expect(request.yar.clear).toHaveBeenCalledWith('ConfirmedBankDetails')
    expect(request.yar.clear).toHaveBeenCalledWith('payload')
    expect(h.redirect).toHaveBeenCalledWith(
      '/bank-details/bank-details-submitted?lang=en'
    )
    expect(result).toBe('redirected')
  })

  it('should redirect to /update-bank-details if ConfirmedBankDetails is missing', async () => {
    request.yar.get = vi.fn().mockReturnValue(undefined)

    const result = await postBankDetailsController.handler(request, h)

    expect(request.yar.get).toHaveBeenCalledWith('ConfirmedBankDetails')
    expect(h.redirect).toHaveBeenCalledWith('bank-details/update-bank-details')
    expect(h.view).not.toHaveBeenCalled?.()
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
    expect(h.redirect).toHaveBeenCalledWith('/update-bank-details-info?lang=en')
    expect(result).toBe('redirected')
  })
})
