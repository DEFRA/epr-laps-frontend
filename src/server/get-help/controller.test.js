import { vi } from 'vitest'
import { createServer } from '../server.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import * as contextModule from '../../config/nunjucks/context/context.js'
import { getHelpController } from './controller.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')
vi.mock('../../config/nunjucks/context/context.js')

describe('#getHelpController', () => {
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
    vi.clearAllMocks()
    vi.spyOn(authUtils, 'getUserSession').mockReturnValue({
      userName: 'test user'
    })
    vi.mocked(contextModule.context).mockResolvedValue({
      currentLang: 'en',
      translations: {
        'laps-home': 'LAPs home',
        'get-help': 'Get Help'
      }
    })
  })

  test('should return 401 when unauthorized', async () => {
    vi.mocked(contextModule.context).mockRejectedValue(
      new Error('Unauthorized')
    )

    const h = {
      response: vi.fn().mockReturnValue({ code: vi.fn() })
    }

    const mockRequest = { logger: { error: vi.fn() } }

    await getHelpController.handler(mockRequest, h)

    expect(h.response).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  test('should render the get help view with correct context', async () => {
    const mockRequest = {
      app: {
        translations: { 'laps-home': 'LAPs home', 'get-help': 'Get Help' },
        currentLang: 'en'
      },
      logger: { error: vi.fn() }
    }

    const h = {
      view: vi.fn().mockReturnValue({ code: vi.fn() })
    }

    await getHelpController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      'get-help/index.njk',
      expect.objectContaining({
        pageTitle: 'Get Help',
        breadcrumbs: expect.arrayContaining([
          expect.objectContaining({ text: 'LAPs home' }),
          expect.objectContaining({ text: 'Get Help' })
        ])
      })
    )
  })

  test('should return 500 when context throws an unexpected error', async () => {
    vi.mocked(contextModule.context).mockRejectedValue(
      new Error('Something went wrong')
    )

    const h = { response: vi.fn().mockReturnValue({ code: vi.fn() }) }
    const mockRequest = { logger: { error: vi.fn() } }

    await getHelpController.handler(mockRequest, h)

    expect(h.response).toHaveBeenCalledWith({
      error: 'Failed to render home page'
    })
  })
})
