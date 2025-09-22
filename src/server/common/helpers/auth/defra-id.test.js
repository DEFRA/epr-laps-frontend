import { defraId } from './defra-id.js'
import { config } from '../../../../config/config.js'
import { getOidcConfig } from './get-oidc-config.js'
import { openIdProvider } from './open-id.js'
import { validateUserSession } from './validate.js'

vi.mock('../../../../config/config.js')
vi.mock('./get-oidc-config.js')
vi.mock('./open-id.js')
vi.mock('./validate.js')

const mockedGetOidcConfig = vi.mocked(getOidcConfig)
const mockedOpenIdProvider = vi.mocked(openIdProvider)
const mockedValidateUserSession = vi.mocked(validateUserSession)

describe('#defraId plugin', () => {
  let mockServer
  let mockOidcConfig
  let mockDefraProvider
  let mockRequest

  beforeEach(() => {
    mockRequest = {
      yar: {
        flash: vi.fn()
      }
    }

    mockOidcConfig = {
      authorization_endpoint: 'https://auth.test.defra.gov.uk/authorize',
      token_endpoint: 'https://auth.test.defra.gov.uk/token',
      end_session_endpoint: 'https://auth.test.defra.gov.uk/logout'
    }

    mockDefraProvider = {
      name: 'defra-id',
      protocol: 'oauth2',
      useParamsAuth: true,
      auth: mockOidcConfig.authorization_endpoint,
      token: mockOidcConfig.token_endpoint,
      pkce: 'S256',
      scope: 'openid offline_access',
      profile: vi.fn()
    }

    mockServer = {
      auth: {
        strategy: vi.fn(),
        default: vi.fn()
      }
    }

    config.get.mockImplementation(() => ({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      serviceId: 'test-service-id',
      redirectUrl: 'https://test.defra.gov.uk',
      scopes: 'openid offline_access',
      cookie: {
        password: 'test-cookie-password',
        secure: true,
        ttl: 3600000
      }
    }))

    mockedGetOidcConfig.mockResolvedValue(mockOidcConfig)
    mockedOpenIdProvider.mockReturnValue(mockDefraProvider)
    mockedValidateUserSession.mockResolvedValue({ isValid: true })
  })

  test('should correctly set the name of auth plugin', () => {
    expect(defraId).toBeInstanceOf(Object)
    expect(defraId.plugin.name).toBe('auth')
    expect(defraId.plugin.register).toBeInstanceOf(Function)
  })

  test('should register plugin successfully', async () => {
    await defraId.plugin.register(mockServer)
    expect(mockServer.auth.strategy).toHaveBeenCalledTimes(2)
    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  test('should set up defra-id strategy with correct configuration', async () => {
    await defraId.plugin.register(mockServer)

    const defraIdStrategyCall = mockServer.auth.strategy.mock.calls.find(
      (call) => call[0] === 'defra-id'
    )

    expect(defraIdStrategyCall).toBeDefined()
    expect(defraIdStrategyCall[1]).toBe('bell')

    const defraIdConfig = defraIdStrategyCall[2]
    const location = defraIdConfig.location

    expect(location).toBeInstanceOf(Function)

    const locationReturnValue = location(mockRequest)
    expect(locationReturnValue).toBe('https://test.defra.gov.uk/auth-response')
  })

  test('should set up session strategy with correct configuration', async () => {
    await defraId.plugin.register(mockServer)

    const defraIdStrategyCall = mockServer.auth.strategy.mock.calls.find(
      (call) => call[0] === 'session'
    )

    expect(defraIdStrategyCall).toBeDefined()
    expect(defraIdStrategyCall[1]).toBe('cookie')

    const defraIdConfig = defraIdStrategyCall[2]
    const validate = defraIdConfig.validate

    expect(validate).toBeInstanceOf(Function)

    const validateReturnValue = await validate(mockRequest)
    expect(validateReturnValue).toEqual({ isValid: true })

    const redirectTo = defraIdConfig.redirectTo

    expect(redirectTo).toBeInstanceOf(Function)

    const redirectToReturnValue = redirectTo(mockRequest)
    expect(redirectToReturnValue).toBe('/auth-response')
  })
})
