import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { signOutController } from './controller.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

describe('#signOutController', () => {
  let server

  beforeAll(async () => {
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    getOidcConfig.mockReset()
    await server.stop({ timeout: 0 })
  })

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user'
    })
    vi.clearAllMocks()
  })

  test('should redirect user when user is unauthenticated', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      }
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/'
    })

    await signOutController.handler(mockRequest, mockedResponse)
    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('should provide expected response', async () => {
    const mockRequest = {
      app: {
        translations: { 'local-authority': 'Mocked Local Authority' },
        currentLang: 'en'
      }
    }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    await signOutController.handler(mockRequest, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council',
      currentLang: 'en',
      translations: {
        'local-authority': 'Mocked Local Authority'
      }
    })
  })

  it('should render with English when lang missing', async () => {
    const req = { query: {}, app: { translations: {} } }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    await signOutController.handler(req, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'sign-out/index.njk',
      expect.objectContaining({ currentLang: 'en' })
    )
  })

  it('should render with Welsh when lang is cy', async () => {
    const req = {
      query: {},
      app: {
        currentLang: 'cy',
        translations: { 'sign-out': 'Allan' }
      }
    }

    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    await signOutController.handler(req, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'sign-out/index.njk',
      expect.objectContaining({
        currentLang: 'cy',
        translations: { 'sign-out': 'Allan' }
      })
    )
  })

  it('should handle missing translations gracefully', async () => {
    const req = { query: { lang: 'cy' }, app: {} }
    const mockedResponse = { redirect: vi.fn(), view: vi.fn() }

    await signOutController.handler(req, mockedResponse)

    expect(mockedResponse.view).toHaveBeenCalledWith(
      'sign-out/index.njk',
      expect.objectContaining({ translations: {} })
    )
  })
})
