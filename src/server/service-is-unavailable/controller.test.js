import { vi } from 'vitest'
import { createServer } from '../server.js'
import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
import * as authUtils from '../common/helpers/auth/utils.js'
import { serviceUnavailableController } from './controller.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

describe('#serviceUnavailableController', () => {
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

  test('should render the service unavailable view with correct context', async () => {
    const mockRequest = { logger: { error: vi.fn() } }
    const h = { view: vi.fn().mockReturnValue({ code: vi.fn() }) }

    await serviceUnavailableController.handler(mockRequest, h)

    expect(h.view).toHaveBeenCalledWith('service-is-unavailable/index.njk', {
      pageTitle: 'Service is unavailable'
    })
  })
})
