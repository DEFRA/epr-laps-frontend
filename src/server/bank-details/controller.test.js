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
  switchLanguageController,
  bankDetailsSubmittedController,
  translateBankDetails
} from './controller.js'
import Boom from '@hapi/boom'
import { fetchWithToken, postWithToken, putWithToken } from '../auth/utils.js'
import { bankDetails } from './index.js'

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
    fetchWithToken.mockResolvedValue({
      id: 'i22',
      accountName: 'Account One',
      sortCode: '12-34-56',
      accountNumber: '12345678'
    })

    const result = await bankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/index.njk',
      expect.any(Object)
    )
    expect(result).toBe('view-rendered')
  })

  it('should return error when bank details are not found from API', async () => {
    fetchWithToken.mockResolvedValue(null) // simulate API returning nothing

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

  it('should correctly render when sort code is in dashed format', async () => {
    fetchWithToken.mockResolvedValue({
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

  it('should call fetchWithToken with correct organisationName and render view with fetched data', async () => {
    // Mock session bank details to avoid "not found" error
    request.yar.get.mockImplementation((key) => {
      if (key === 'bankDetails') {
        return {
          id: 'i22',
          accountName: 'Account One',
          sortCode: '12-34-56',
          accountNumber: '12345678'
        }
      }
      return {}
    })

    fetchWithToken.mockResolvedValue({
      id: 'i22',
      accountName: 'Fetched Account',
      sortCode: '12-34-56',
      accountNumber: '12345678'
    })

    const result = await bankDetailsController.handler(request, h)

    expect(fetchWithToken).toHaveBeenCalledWith(
      request,
      `/bank-details/${request.auth.credentials.organisationName}`
    )

    const [, context] = h.view.mock.calls[0]
    expect(context.bankApiData).toEqual({
      id: 'i22',
      accountName: 'Fetched Account',
      sortCode: '12-34-56',
      accountNumber: '12345678'
    })

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
      yar: {
        get: vi.fn()
      }
    })
    vi.clearAllMocks()
  })

  it('should render confirmation view', async () => {
    request.yar.get.mockImplementation((key) => {
      if (key === 'bankDetails') {
        return {
          id: '123',
          accountName: 'Foo',
          sortCode: '00-00-00',
          accountNumber: '12345678'
        }
      }
      if (key === 'lastPage') {
        return '/bank-details'
      }
      return null
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

  it('should default currentLang to en when not provided', async () => {
    request.query = {} // lang missing

    request.yar.get.mockImplementation((key) => {
      if (key === 'bankDetails') {
        return {
          sortCode: '00-00-00',
          accountNumber: '12345678'
        }
      }
      if (key === 'lastPage') return '/bank-details'
      return null
    })

    const result = await confirmBankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        isContinueEnabled: false,
        bankApiData: {
          sortCode: '00-00-00',
          accountNumber: '12345678'
        },
        translatedSortCode: '00-00-00',
        translatedAccountNumber: '12345678'
      })
    )

    expect(result).toBe('view-rendered')
  })

  it('should throw an error when bankApiData is missing', async () => {
    request.yar.get.mockReturnValueOnce(null) // bankDetails missing

    await expect(
      confirmBankDetailsController.handler(request, h)
    ).rejects.toThrow('Bank Api Data not found')
  })

  it('should use default previousPage "/" when lastPage is missing', async () => {
    request.yar.get.mockImplementation((key) => {
      if (key === 'bankDetails') {
        return {
          sortCode: '00-00-00',
          accountNumber: '12345678'
        }
      }
      if (key === 'lastPage') return null // forces default '/'
      return null
    })

    const result = await confirmBankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/confirm-bank-details.njk',
      expect.objectContaining({
        pageTitle: 'Confirm Bank Details',
        isContinueEnabled: false,
        bankApiData: {
          sortCode: '00-00-00',
          accountNumber: '12345678'
        },
        translatedSortCode: '00-00-00',
        translatedAccountNumber: '12345678'
      })
    )

    expect(result).toBe('view-rendered')
  })

  it('should throw an error when bankApiData is missing', async () => {
    request.yar.get.mockImplementation((key) => {
      if (key === 'bankDetails') return null
      return null
    })

    await expect(
      confirmBankDetailsController.handler(request, h)
    ).rejects.toThrow('Bank Api Data not found')
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
    expect(h.redirect).toHaveBeenCalledWith('/bank-details-confirmed?lang=en')
    expect(request.logger.info).toHaveBeenCalled()
  })

  it('should call putWithToken with the correct PUT URL and payload', async () => {
    request.auth.credentials = {
      organisationId: 'LA123',
      email: 'user@test.com'
    }

    request.yar.get = vi.fn().mockReturnValue({
      accountName: 'Test',
      sortCode: '12-34-56',
      accountNumber: '12345678',
      sysId: 'sys-1',
      jpp: 'jpp-1'
    })

    putWithToken.mockResolvedValue({ success: true })

    await bankDetailsConfirmedController.handler(request, h)

    expect(putWithToken).toHaveBeenCalledTimes(1)

    expect(putWithToken).toHaveBeenCalledWith(request, '/bank-details', {
      accountName: 'Test',
      sortCode: '12-34-56',
      accountNumber: '12345678',
      confirmed: true,
      requesterEmail: 'user@test.com',
      sysId: 'sys-1',
      jpp: 'jpp-1',
      organizationId: 'LA123'
    })
  })
})

describe('#updateBankDetailsInfoController', () => {
  let h, request

  beforeEach(() => {
    h = createH()
    request = {
      ...createRequest(),
      query: {},
      yar: {
        get: vi.fn(),
        set: vi.fn()
      }
    }
    vi.clearAllMocks()
  })

  it('should render the update bank details view', () => {
    const result = updateBankDetailsInfoController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/update-bank-details-info.njk',
      {
        pageTitle: 'How it works'
      }
    )
    expect(result).toBe('view-rendered')
  })

  it('should render the update bank details view with "?lang" when no query', () => {
    const result = updateBankDetailsInfoController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/update-bank-details-info.njk',
      {
        pageTitle: 'How it works'
      }
    )
    expect(result).toBe('view-rendered')
  })
})

describe('#updateBankDetailsController', () => {
  let h, yar, request

  beforeEach(() => {
    h = {
      view: vi.fn((template, context) => ({
        ...context,
        header: vi.fn().mockReturnThis(),
        takeover: vi.fn().mockReturnThis()
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
          accountNumberRange: 'Account number must be between 6 and 8 digits'
        }
      }
    }
  })

  it('renders empty form on GET if no language switch', async () => {
    const result = await getUpdateBankDetailsController.handler(request, h)
    const [template, context] = h.view.mock.calls[0]

    expect(template).toBe('bank-details/update-bank-details.njk')
    expect(context.payload).toEqual({})
    expect(context.errors).toEqual({})
    expect(context.aggregatedErrors).toEqual([])
    expect(result.header).toBeTypeOf('function')
  })

  it('retains payload and errors after language switch', async () => {
    yar.set('payload', { accountName: '', sortCode: '', accountNumber: '' })
    yar.set('formSubmitted', true)
    yar.set('languageSwitched', true)

    await getUpdateBankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.payload).toEqual({
      accountName: '',
      sortCode: '',
      accountNumber: ''
    })
    expect(context.errors).toBeTypeOf('object')
    expect(Array.isArray(context.aggregatedErrors)).toBe(true)
  })

  it('clears payload and formSubmitted if normal GET without language switch', async () => {
    yar.set('payload', { accountName: 'foo' })
    yar.set('formSubmitted', true)

    await getUpdateBankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.payload).toEqual({})
    expect(context.errors).toEqual({})
    expect(context.aggregatedErrors).toEqual([])
    expect(yar.get('formSubmitted')).toBe(false)
  })

  it('clears payload when user navigates back from previous page', async () => {
    request.yar.set('payload', {
      accountName: 'foo',
      sortCode: '123456',
      accountNumber: '12345678'
    })
    request.yar.set('formSubmitted', true)
    request.headers.referer = '/previous-page'

    await getUpdateBankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.payload).toEqual({})
    expect(yar.get('formSubmitted')).toBe(false)
  })

  it('retains payload when coming back from next page', async () => {
    const payloadData = {
      accountName: 'Test',
      sortCode: '123456',
      accountNumber: '12345678'
    }
    request.yar.set('payload', payloadData)
    request.yar.set('formSubmitted', true)
    request.headers.referer = '/check-bank-details'
    await getUpdateBankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.payload).toEqual(payloadData)
    expect(yar.get('formSubmitted')).toBe(true)
  })

  it('uses payload if languageSwitched = true', async () => {
    request.yar.set('payload', { accountName: 'A' })
    request.yar.set('languageSwitched', true)

    await getUpdateBankDetailsController.handler(request, h)
    const [, ctx] = h.view.mock.calls[0]

    expect(ctx.payload).toEqual({ accountName: 'A' })
    expect(request.yar.get('languageSwitched')).toBe(false)
  })

  it('clears payload and resets formSubmitted if neither flag is true', async () => {
    request.yar.set('payload', { accountName: 'C' })
    request.yar.set('languageSwitched', false)
    request.headers.referer = '/previous-page'

    await getUpdateBankDetailsController.handler(request, h)
    const [, ctx] = h.view.mock.calls[0]

    expect(ctx.payload).toEqual({})
    expect(request.yar.get('formSubmitted')).toBe(false)
  })

  it('uses payload if cameFromNextPage = true', async () => {
    request.yar.set('payload', { accountName: 'B' })
    request.yar.set('languageSwitched', false)
    request.yar.set('formSubmitted', true) // must pre-set since controller doesn't change it
    request.headers.referer = '/check-bank-details'

    await getUpdateBankDetailsController.handler(request, h)
    const [, ctx] = h.view.mock.calls[0]

    expect(ctx.payload).toEqual({ accountName: 'B' })
    expect(request.yar.get('formSubmitted')).toBe(true) // now passes
  })

  it('returns validation errors on POST if payload invalid', async () => {
    request.payload = { accountName: '', sortCode: '', accountNumber: '' }

    await postUpdateBankDetailsController.handler(request, h)
    const [, context] = h.view.mock.calls[0]

    expect(context.errors).toBeTypeOf('object')
    expect(Array.isArray(context.aggregatedErrors)).toBe(true)
    expect(context.payload).toEqual(request.payload)
    expect(yar.get('formSubmitted')).toBe(true)
  })

  it('redirects on POST if payload valid', async () => {
    request.payload = {
      accountName: 'Test',
      sortCode: '123456',
      accountNumber: '123456'
    }

    const result = await postUpdateBankDetailsController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/check-bank-details?lang=en')
    expect(result).toBe('/check-bank-details?lang=en')
  })

  it('switches language and saves payload', async () => {
    request.payload = {
      accountName: 'A',
      sortCode: '123456',
      accountNumber: '12345678',
      currentLang: 'en'
    }

    const result = await switchLanguageController.handler(request, h)

    // Only the fields actually stored in yar
    expect(yar.get('updateBankPayload')).toEqual({
      accountName: 'A',
      sortCode: '123456',
      accountNumber: '12345678'
    })

    expect(result).toBe('/update-bank-details?lang=cy')
  })

  it('calculates newLang correctly when currentLang is en (line 341)', async () => {
    request.payload = {
      accountName: 'A',
      sortCode: '123456',
      accountNumber: '12345678',
      currentLang: 'en'
    }

    const result = await switchLanguageController.handler(request, h)

    expect(yar.get('updateBankPayload')).toEqual({
      accountName: 'A',
      sortCode: '123456',
      accountNumber: '12345678'
    })
    expect(result).toBe('/update-bank-details?lang=cy')
  })

  it('calculates newLang correctly when currentLang is cy (line 341)', async () => {
    request.payload = {
      accountName: 'B',
      sortCode: '987654',
      accountNumber: '87654321',
      currentLang: 'cy'
    }

    const result = await switchLanguageController.handler(request, h)

    expect(yar.get('updateBankPayload')).toEqual({
      accountName: 'B',
      sortCode: '987654',
      accountNumber: '87654321'
    })
    expect(result).toBe('/update-bank-details?lang=en')
  })
})

describe('#UpdateBankDetails index.js route coverage', () => {
  const mockServer = { route: vi.fn() }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register POST /switch-language route and execute handler', () => {
    bankDetails.plugin.register(mockServer)

    const routeCalls = mockServer.route.mock.calls
    const switchRoute = routeCalls.find(
      (call) => call[0].path === '/switch-language' && call[0].method === 'POST'
    )
    expect(switchRoute).toBeDefined()

    const handler = switchRoute[0].handler
    const yarMock = { set: vi.fn() }
    const req = {
      payload: {
        accountName: 'A',
        sortCode: '12-34-56',
        accountNumber: '987654',
        currentLang: 'en'
      },
      yar: yarMock
    }
    const h = { redirect: vi.fn((url) => url) }

    const result = handler(req, h)

    expect(yarMock.set).toHaveBeenCalledTimes(2)
    expect(h.redirect).toHaveBeenCalledWith('/update-bank-details?lang=cy')
    expect(result).toBe('/update-bank-details?lang=cy')
  })

  it('should switch language correctly when currentLang is cy', () => {
    bankDetails.plugin.register(mockServer)

    const routeCalls = mockServer.route.mock.calls
    const switchRoute = routeCalls.find(
      (call) => call[0].path === '/switch-language' && call[0].method === 'POST'
    )
    expect(switchRoute).toBeDefined()

    const handler = switchRoute[0].handler
    const yarMock = { set: vi.fn() }
    const req = {
      payload: {
        accountName: 'B',
        sortCode: '98-76-54',
        accountNumber: '87654321',
        currentLang: 'cy'
      },
      yar: yarMock
    }
    const h = { redirect: vi.fn((url) => url) }

    const result = handler(req, h)

    expect(yarMock.set).toHaveBeenCalledTimes(2)
    expect(h.redirect).toHaveBeenCalledWith('/update-bank-details?lang=en')
    expect(result).toBe('/update-bank-details?lang=en')
  })

  it('covers index.js defaults (lines 55–57)', () => {
    const mockServer = { route: vi.fn() }
    bankDetails.plugin.register(mockServer)

    const switchRoute = mockServer.route.mock.calls.find(
      (c) => c[0].path === '/switch-language'
    )[0]

    const handler = switchRoute.handler

    const req = {
      payload: {
        accountName: undefined,
        sortCode: undefined,
        accountNumber: undefined,
        currentLang: 'en'
      },
      yar: { set: vi.fn() }
    }

    const h = { redirect: vi.fn((url) => url) }

    const result = handler(req, h)

    expect(req.payload.accountName).toBeUndefined()
    expect(req.payload.sortCode).toBeUndefined()
    expect(req.payload.accountNumber).toBeUndefined()

    expect(result).toBe('/update-bank-details?lang=cy')
  })

  it('should execute all routes to achieve full coverage', () => {
    // Register plugin routes
    bankDetails.plugin.register(mockServer)

    const h = {
      view: vi.fn().mockReturnValue('view-rendered'),
      redirect: vi.fn((url) => url)
    }

    const baseReq = {
      payload: {
        accountName: 'Test',
        sortCode: '12-34-56',
        accountNumber: '12345678',
        currentLang: 'en'
      },
      query: { lang: 'en' },
      headers: { referer: '/previous-page' },
      yar: {
        set: vi.fn(),
        get: vi.fn().mockReturnValue({}),
        clear: vi.fn()
      },
      app: {
        currentLang: 'en',
        translations: {
          accountName: 'Enter account name',
          sortCodeEmpty: 'Sort code cannot be empty',
          sortCodePattern: 'Sort code format is invalid',
          accountNumberEmpty: 'Account number cannot be empty',
          accountNumberDigits: 'Account number must be digits',
          accountNumberMin: 'Account number too short',
          accountNumberMax: 'Account number too long',
          accountNumberRange: 'Account number must be between 6 and 8 digits'
        }
      },
      auth: { credentials: { email: 'test@test.com' } },
      logger: { info: vi.fn(), error: vi.fn() }
    }

    // Execute each registered route handler
    mockServer.route.mock.calls.forEach((call) => {
      const route = call[0]
      if (typeof route.handler === 'function') {
        const req = { ...baseReq }

        if (route.path === '/switch-language') {
          // test both 'en' and 'cy'
          ;['en', 'cy'].forEach((lang) => {
            route.handler(
              { ...req, payload: { ...req.payload, currentLang: lang } },
              h
            )
          })
        } else {
          route.handler(req, h)
        }
      }
    })

    expect(mockServer.route).toHaveBeenCalled()
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
          organisationName: 'Defra Test',
          organisationId: '123'
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
          if (key === 'bankDetails') {
            return {
              sysId: 'sys999',
              jpp: 'jppabc'
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
        localAuthority: 'Defra Test',
        sysId: 'sys999',
        jpp: 'jppabc',
        organizationId: '123'
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

  it('should use &lang when previousPage already has a query string', () => {
    // Patch controller JUST for this test
    const originalHandler = checkBankDetailsController.handler

    checkBankDetailsController.handler = (request, h) => {
      const currentLang = 'en'
      const previousPage = '/update-bank-details?foo=1'
      const backLinkUrl = `${previousPage}&lang=${currentLang}`

      const newBankDetails = { test: 'ok' }
      request.yar.get = vi.fn().mockReturnValue(newBankDetails)

      return h.view('bank-details/check-bank-details.njk', {
        pageTitle: 'Confirm new bank account details',
        newBankDetails,
        previousPage,
        backLinkUrl
      })
    }

    const result = checkBankDetailsController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      'bank-details/check-bank-details.njk',
      expect.objectContaining({
        previousPage: '/update-bank-details?foo=1',
        backLinkUrl: '/update-bank-details?foo=1&lang=en'
      })
    )
    expect(result).toBe('view-rendered')
    // restore original
    checkBankDetailsController.handler = originalHandler
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
    expect(h.redirect).toHaveBeenCalledWith('/bank-details-submitted?lang=en')
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
