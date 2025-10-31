import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  postBankDetailsController,
  checkBankDetailsController,
  updateBankDetailsInfoController,
  getUpdateBankDetailsController,
  postUpdateBankDetailsController
} from './controller.js'
import * as authUtils from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

vi.mock('../../server/auth/utils.js', () => ({
  __esModule: true,
  fetchWithToken: vi.fn(),
  putWithToken: vi.fn(),
  postWithToken: vi.fn()
}))

vi.mock('../../config/nunjucks/context/context.js', () => ({
  __esModule: true,
  context: vi.fn()
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
    expect(result).toEqual({
      payload: { error: 'Unauthorized' },
      statusCode: 401,
      code: expect.any(Function)
    })
  })

  it('should handle generic errors gracefully', async () => {
    const genericError = new Error('Something went wrong')
    context.mockRejectedValue(genericError)

    const result = await bankDetailsController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      'Error fetching bank details:',
      genericError
    )
    expect(result).toEqual({
      payload: { error: 'Failed to fetch bank details' },
      statusCode: 500,
      code: expect.any(Function)
    })
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
  it('should handle context failure and return 500', async () => {
    const contextError = new Error('Context failure')
    context.mockRejectedValue(contextError)

    const result = await bankDetailsConfirmedController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      contextError,
      'Failed to confirm bank details'
    )
    expect(result).toEqual({
      payload: { error: 'Failed to fetch bank details' },
      statusCode: 500,
      code: expect.any(Function)
    })
  })

  it('should handle putWithToken failure and return 500', async () => {
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
    const putError = new Error('PUT failed')
    authUtils.putWithToken.mockRejectedValue(putError)

    const result = await bankDetailsConfirmedController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      putError,
      'Failed to confirm bank details'
    )
    expect(result).toEqual({
      payload: { error: 'Failed to fetch bank details' },
      statusCode: 500,
      code: expect.any(Function)
    })
  })

  it('should handle unexpected rejection (non-Error) gracefully', async () => {
    context.mockRejectedValue('some string instead of Error')

    const result = await bankDetailsConfirmedController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      'some string instead of Error',
      'Failed to confirm bank details'
    )
    expect(result).toEqual({
      payload: { error: 'Failed to fetch bank details' },
      statusCode: 500,
      code: expect.any(Function)
    })
  })

  it('should handle missing bankApiData in context gracefully', async () => {
    context.mockResolvedValue({
      bankApiData: null,
      translations: { 'laps-home': 'Home', 'bank-details': 'Bank Details' },
      currentLang: 'en'
    })

    const result = await bankDetailsConfirmedController.handler(request, h)

    expect(request.logger.error).toHaveBeenCalledWith(
      expect.any(TypeError),
      'Failed to confirm bank details'
    )
    expect(result).toEqual({
      payload: { error: 'Failed to fetch bank details' },
      statusCode: 500,
      code: expect.any(Function)
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

  describe('bank-details controllers', () => {
    let h
    let yar
    let request

    beforeEach(() => {
      h = {
        view: vi.fn(() => ({
          value: 'view-rendered',
          takeover: vi.fn().mockReturnValue({ value: 'view-rendered' })
        })),
        response: vi.fn(() => ({
          code: vi.fn().mockReturnValue('response-set')
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
        path: '/bank-details',
        payload: {},
        yar
      }
    })

    it('renders the view correctly with default language', async () => {
      const result = await getUpdateBankDetailsController.handler(request, h)
      const [template, context] = h.view.mock.calls[0]

      expect(template).toBe('bank-details/update-bank-details.njk')
      expect(context.pageTitle).toBe('Update Bank Details')
      expect(context.errors).toEqual({})
      expect(result.value).toBe('view-rendered')
    })

    it('validates payload when formSubmitted = true and returns errors', async () => {
      yar.set('payload', { accountName: '', sortCode: '', accountNumber: '' })
      yar.set('formSubmitted', true)

      const result = await getUpdateBankDetailsController.handler(request, h)
      const [, context] = h.view.mock.calls[0]

      expect(context.errors).toBeTypeOf('object')
      expect(result.value).toBe('view-rendered')
    })

    it('renders view with validation errors when payload invalid', async () => {
      const failAction =
        postUpdateBankDetailsController.options.validate.failAction
      request.payload = { accountName: '', sortCode: '', accountNumber: '' }

      const result = await failAction(request, h)

      expect(h.view).toHaveBeenCalledWith(
        'bank-details/update-bank-details.njk',
        expect.objectContaining({
          payload: request.payload,
          errors: expect.any(Object),
          aggregatedErrors: expect.any(Array),
          t: expect.any(Object)
        })
      )
      expect(result.value).toBe('view-rendered')
    })

    it('returns success response when payload valid', async () => {
      request.payload = {
        accountName: 'Test Account',
        sortCode: '123456',
        accountNumber: '12345678'
      }

      const result = await postUpdateBankDetailsController.handler(request, h)

      // Ensure redirect was called with correct URL
      expect(h.redirect).toHaveBeenCalledWith('/check-bank-details')
      expect(result).toBe('/check-bank-details') // because mock returns url
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

    it('should call postWithToken and redirect on success', async () => {
      authUtils.postWithToken.mockResolvedValue({})

      const result = await postBankDetailsController.handler(request, h)

      expect(authUtils.postWithToken).toHaveBeenCalledWith(
        request,
        '/bank-details',
        {
          accountNumber: '094785923',
          accountName: 'Defra Test',
          sortCode: '09-03-023',
          requesterName: 'Juhi',
          localAuthority: 'Defra Test'
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(
        '/bank-details/bank-details-submitted?lang=en'
      )
      expect(result).toBe('redirected')
    })
  })
})
