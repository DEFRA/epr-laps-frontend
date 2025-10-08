import wreck from '@hapi/wreck'
import { getOidcConfig, getOpenIdRefreshToken } from './get-oidc-config.js'
import { config } from '../../../../config/config.js'

const mockPost = vi.fn()

vi.mock('@hapi/wreck', () => ({
  default: {
    get: vi.fn().mockReturnValue({}),
    post: (...args) => mockPost(...args)
  }
}))

const oidcConfigUrl =
  'http://test-oidc/cdp-defra-id-stub/.well-known/openid-configuration'
const oidcRefreshUrl = 'https://refresh-token-endpoint'

describe('#getOidcConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    config.get = vi.fn().mockImplementation((key) => {
      const configValues = {
        'defraId.oidcConfigurationUrl': oidcConfigUrl,
        'defraId.clientId': 'some-client-id',
        'defraId.clientSecret': 'some-client-secret',
        'defraId.scopes': ['some-scopes'],
        'defraId.redirectUrl': 'http://test-redirect-url'
      }
      return configValues[key]
    })
  })

  describe('#getOpenIdConfig', () => {
    test('Should call wreck get', async () => {
      await getOidcConfig()
      expect(wreck.get).toHaveBeenCalledWith(
        oidcConfigUrl,
        expect.objectContaining({
          json: true
        })
      )
    })
  })

  describe('#getOpenIdRefreshToken', () => {
    test('Should return ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 200
        },
        payload:
          '{ "access_token": "FOO", "expires_in": 1000, "id_token": "FOO", "refresh_token": "FOO" }'
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeTruthy()
      expect(result.json).toEqual(
        expect.objectContaining({
          access_token: 'FOO'
        })
      )
    })

    test('Should return not ok response', async () => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 500
        }
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeFalsy()
    })

    test('Should return not ok response if there is an error', async () => {
      mockPost.mockReturnValue({ res: { statusCode: 200 } })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(result.ok).toBeFalsy()
      expect(result.error).toBeTruthy()
    })
  })

  describe('When refresh response does not contain valid JSON payload', () => {
    test.each([
      { refreshPayload: null },
      { refreshPayload: 'FOO' },
      { refreshPayload: '{}' },
      { refreshPayload: '{ "access_token": "some-token" }' },
      { refreshPayload: '{ "access_token": "FOO", "expires_in": 1000 }' },
      {
        refreshPayload:
          '{ "access_token": "FOO", "expires_in": 1000, "id_token": "FOO" }'
      }
    ])('Should return not ok response', async ({ refreshPayload }) => {
      mockPost.mockReturnValue({
        res: {
          statusCode: 200
        },
        payload: refreshPayload
      })

      const params = {
        client_id: 'some-client-id',
        client_secret: 'some-client-secret',
        grant_type: 'refresh_token',
        refresh_token: 'some-refresh-token',
        scope: 'some-client-id openid',
        redirect_uri: 'http://some-uri'
      }

      const result = await getOpenIdRefreshToken(oidcRefreshUrl, params)

      expect(mockPost).toHaveBeenCalledWith(
        oidcRefreshUrl,
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
          },
          payload:
            'client_id=some-client-id&client_secret=some-client-secret&grant_type=refresh_token&refresh_token=some-refresh-token&scope=some-client-id%20openid&redirect_uri=http%3A%2F%2Fsome-uri'
        })
      )
      expect(result.ok).toBeFalsy()
      expect(result).toEqual(
        expect.not.objectContaining({
          json: expect.anything()
        })
      )
    })
  })
})
