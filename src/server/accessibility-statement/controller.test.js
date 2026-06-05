import { getOidcConfig } from '../common/helpers/auth/get-oidc-config.js'
// import { accessibilityController } from './controller.js'
import { config } from '../../config/config.js'
import { createServer } from '../server.js'

vi.mock('../common/helpers/auth/get-oidc-config.js')

describe.skip('#accessibilityController', () => {
  let server

  beforeEach(async () => {
    // Mock OIDC configuration
    vi.mocked(getOidcConfig).mockResolvedValue({
      authorization_endpoint: 'https://test-idm-endpoint/authorize',
      token_endpoint: 'https://test-idm-endpoint/token',
      end_session_endpoint: 'https://test-idm-endpoint/logout'
    })

    // Create a fresh server instance for each test
    server = await createServer(config)

    // Mock authentication only once
    if (!server.auth.settings.default) {
      server.auth.scheme('mock', () => ({
        authenticate: (request, h) =>
          h.authenticated({ credentials: { user: 'test-user' } })
      }))
      server.auth.strategy('default', 'mock')
      server.auth.default('default')
    }
  })

  afterEach(async () => {
    // Stop the server and clear mocks after each test
    await server.stop()
    vi.clearAllMocks()
  })

  test('should render accessibility statement page', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/accessibility-statement'
    })

    expect(response.statusCode).toBe(200)
    expect(response.result).toContain('Accessibility Statement')
  })

  test('should handle missing OIDC configuration gracefully', async () => {
    vi.mocked(getOidcConfig).mockResolvedValue(null) // Simulate missing OIDC config

    const response = await server.inject({
      method: 'GET',
      url: '/accessibility-statement'
    })

    expect(response.statusCode).toBe(500) // Expect server error
    expect(response.result).toContain('Internal Server Error') // Check for error message
  })

  test('should handle errors in getOidcConfig', async () => {
    vi.mocked(getOidcConfig).mockRejectedValue(new Error('OIDC config error')) // Simulate error

    const response = await server.inject({
      method: 'GET',
      url: '/accessibility-statement'
    })

    expect(response.statusCode).toBe(500) // Expect server error
    expect(response.result).toContain('Internal Server Error') // Check for error message
  })

  test('should return 404 for invalid routes', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/invalid-route'
    })

    expect(response.statusCode).toBe(404) // Expect not found
    expect(response.result).toContain('Not Found') // Check for error message
  })

  test('should handle unexpected server errors', async () => {
    // Simulate an unexpected error in the controller
    server.route({
      method: 'GET',
      path: '/accessibility-statement',
      handler: () => {
        throw new Error('Unexpected error')
      }
    })

    const response = await server.inject({
      method: 'GET',
      url: '/accessibility-statement'
    })

    expect(response.statusCode).toBe(500) // Expect server error
    expect(response.result).toContain('Internal Server Error') // Check for error message
  })
})
