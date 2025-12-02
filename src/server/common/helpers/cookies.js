import { config } from '../../../config/config.js'

/**
 * Sets the default cookie policy state on a Hapi response.
 *
 * @param {ResponseObject} response
 * @returns {ResponseObject}
 */

export function setDefaultCookiePolicy(response) {
  const cookiesPolicy = {
    essential: true,
    settings: false,
    usage: false,
    campaigns: false
  }
  response.state('cookie_policy', cookiesPolicy, {
    encoding: 'base64json',
    maxAge: config.get('cookies.cookie_policy.ttl')
  })
}

export function setCookiePreference(response) {
  response.state('cookie_preferences_set', 'true', {
    ttl: config.get('cookies.cookie_policy.ttl'),
    isSecure: config.get('cookies.cookie_policy.secure'),
    isHttpOnly: config.get('cookies.cookie_policy.httpOnly'),
    path: '/'
  })
  return response
}

export function setLocaleCookie(response, locale) {
  return response.state('locale', locale, {
    ttl: config.get('cookies.cookie_policy.ttl'),
    isSecure: config.get('cookies.cookie_policy.secure'),
    isHttpOnly: config.get('cookies.cookie_policy.httpOnly'),
    isSameSite: config.get('cookies.cookie_policy.sameSite'),
    path: '/'
  })
}
