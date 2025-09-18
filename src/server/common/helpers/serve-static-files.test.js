import { startServer } from './start-server.js'
import { statusCodes } from '../constants/status-codes.js'
import { getOidcConfig } from './auth/get-oidc-config.js'

vi.mock('./auth/get-oidc-config.js')

describe('#serveStaticFiles', () => {
  let server

  describe('When secure context is disabled', () => {
    beforeEach(async () => {
      vi.mocked(getOidcConfig).mockResolvedValue({
        authorization_endpoint: 'https://test-idm-endpoint/authorize',
        token_endpoint: 'https://test-idm-endpoint/token',
        end_session_endpoint: 'https://test-idm-endpoint/logout'
      })
      server = await startServer()
    })

    afterEach(async () => {
      await server.stop({ timeout: 0 })
    })

    test('Should serve favicon as expected', async () => {
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/favicon.ico'
      })

      expect(statusCode).toBe(statusCodes.noContent)
    })

    test('Should serve assets as expected', async () => {
      // Note npm run build is ran in the postinstall hook in package.json to make sure there is always a file
      // available for this test. Remove as you see fit
      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/public/assets/images/govuk-crest.svg'
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
