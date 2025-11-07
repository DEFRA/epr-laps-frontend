import { config } from '../../../config/config.js'

/**
 * Sets the default cookie policy state on a Hapi response.
 *
 * @param {ResponseToolkit | ResponseObject} hOrResponse
 * @returns {ResponseObject}
 */
export function setDefaultCookiePolicy(hOrResponse) {
  const response =
    typeof hOrResponse.response === 'function'
      ? hOrResponse.response()
      : hOrResponse

  response.state(
    'cookie_policy',
    JSON.stringify({
      essential: true,
      settings: false,
      usage: false,
      campaigns: false
    }),
    {
      maxAge: config.get('cookies.cookie_policy.ttl')
    }
  )

  return response
}
