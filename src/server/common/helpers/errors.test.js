import { catchAll } from './errors.js'
import { statusCodes } from '../constants/status-codes.js'
import { getOidcConfig } from './auth/get-oidc-config.js'
import { initializeTestServer } from '../test-helpers/test-server.js'

vi.mock('./auth/get-oidc-config.js')
describe('#errors', () => {
  let server

  beforeAll(async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })

    server = await initializeTestServer()
  })

  afterAll(async () => {
    if (server) {
      await server.stop()
    }
    vi.clearAllMocks()
  })

  test('Should provide expected Not Found page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/non-existent-path',
      auth: {
        credentials: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            name: 'Test User'
          }
        },
        strategy: 'session',
        isAuthenticated: true
      }
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
  })
})

describe('#catchAll', () => {
  const mockErrorLogger = vi.fn()
  const mockStack = 'Mock error stack'
  const errorPage = 'error/index'
  const mockRequest = (statusCode) => ({
    app: {
      translations: {
        'page-not found': 'Page not found',
        'you-can-return': 'You can return to the GOV.UK website.',
        'service-unavailable': 'Sorry, the service is currently unavailable',
        'you-will-be': 'You will be able to use the service soon.',
        forbidden: 'Forbidden',
        'you-do': 'You do not have permission to access this page.',
        unauthorized: 'Unauthorized',
        'you-need-to': 'You need to sign in to view this page.',
        'service-problem': 'Sorry, there is a problem with the service',
        'try-again': 'Try again later.'
      }
    },
    response: {
      isBoom: true,
      stack: mockStack,
      output: {
        statusCode
      }
    },
    logger: { error: mockErrorLogger }
  })
  const mockToolkitView = vi.fn()
  const mockToolkitCode = vi.fn()
  const mockToolkit = {
    view: mockToolkitView.mockReturnThis(),
    code: mockToolkitCode.mockReturnThis()
  }

  test('Should provide expected "Not Found" page', () => {
    const req = mockRequest(statusCodes.notFound)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['page-not found'],
      heading: req.app.translations['page-not found'],
      message: req.app.translations['you-can-return'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.notFound)
  })

  test('Should provide expected "Service Unavailable" page', () => {
    const req = mockRequest(statusCodes.serviceUnavailable)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalled()
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['service-unavailable'],
      heading: req.app.translations['service-unavailable'],
      message: req.app.translations['you-will-be'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.serviceUnavailable)
  })

  test('Should provide expected "Forbidden" page', () => {
    const req = mockRequest(statusCodes.forbidden)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['forbidden'],
      heading: req.app.translations['forbidden'],
      message: req.app.translations['you-do'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.forbidden)
  })

  test('Should provide expected "Unauthorized" page', () => {
    const req = mockRequest(statusCodes.unauthorized)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['unauthorized'],
      heading: req.app.translations['unauthorized'],
      message: req.app.translations['you-need-to'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.unauthorized)
  })

  test('Should provide expected default page for unknown errors', () => {
    const req = mockRequest(statusCodes.imATeapot)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).not.toHaveBeenCalled()
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['service-problem'],
      heading: req.app.translations['service-problem'],
      message: req.app.translations['try-again'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(statusCodes.imATeapot)
  })

  test('Should log error and render page for internal server error', () => {
    const req = mockRequest(statusCodes.internalServerError)
    catchAll(req, mockToolkit)

    expect(mockErrorLogger).toHaveBeenCalledWith(mockStack)
    expect(mockToolkitView).toHaveBeenCalledWith(errorPage, {
      pageTitle: req.app.translations['service-problem'],
      heading: req.app.translations['service-problem'],
      message: req.app.translations['try-again'],
      translations: req.app.translations
    })
    expect(mockToolkitCode).toHaveBeenCalledWith(
      statusCodes.internalServerError
    )
  })

  test('Should continue when response is not Boom', () => {
    const req = {
      response: {} // missing 'isBoom'
    }

    const h = { continue: 'continue' }

    const result = catchAll(req, h)

    expect(result).toBe('continue')
  })
})
