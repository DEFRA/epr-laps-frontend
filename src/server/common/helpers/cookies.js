import { config } from '../../../config/config.js'

/**
 * Sets the default cookie policy state on a Hapi response.
 *
 * @param {ResponseObject} response
 * @returns {ResponseObject}
 */
export function setDefaultCookiePolicy(response) {
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
