import { vi } from 'vitest'
import { createServer } from '../server.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { getHelpController } from './controller.js'
import { config } from '../../config/config.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

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
  })

  test('should render the get help view with correct context including getHelpUrl', async () => {
    const mockRequest = {
      app: {
        translations: { 'laps-home': 'LAPs home', 'get-help': 'Get Help' },
        currentLang: 'en'
      }
    }

    const h = {
      view: vi.fn().mockReturnValue({ code: vi.fn() })
    }

    await getHelpController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith(
      'get-help/index.njk',
      expect.objectContaining({
        pageTitle: 'Get Help',
        currentLang: 'en',
        translations: expect.objectContaining({
          'laps-home': 'LAPs home',
          'get-help': 'Get Help'
        }),
        getHelpUrl: config.get('getHelpUrl'),
        breadcrumbs: expect.arrayContaining([
          expect.objectContaining({ text: 'LAPs home', href: '/?lang=en' }),
          expect.objectContaining({
            text: 'Get Help',
            href: '/get-help?lang=en'
          })
        ])
      })
    )
  })
})
