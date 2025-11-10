import { setUserSession } from './utils.js'
import { setDefaultCookiePolicy } from '../../server/common/helpers/cookies.js'

export const authorizeOIDCController = {
  method: ['GET', 'POST'],
  path: '/auth-response',
  options: {
    auth: { strategy: 'defra-id', mode: 'try' }
  },
  handler: async (request, h) => {
    request.logger.debug(`Auth status: ${request.auth?.isAuthenticated}`)
    if (request.auth?.error) {
      request.logger.error(
        `Authentication error: ${request.auth.error.message}`
      )
    }
    if (request.auth?.isAuthenticated) {
      await setUserSession(request)

      request.logger.info('User has been successfully authenticated')

      request.logger.debug(
        `auth credentials ${JSON.stringify(request.auth.credentials)}`
      )
    }

    request.logger.debug(
      `referrer value from flash: ${request.yar.flash('referrer')}`
    )
    const redirect = request.yar.flash('referrer')?.at(0) ?? '/'

    const response = h.redirect(redirect)

    const defaultPolicy = {
      essential: true,
      settings: false,
      usage: false,
      campaigns: false
    }

    return setDefaultCookiePolicy(response, defaultPolicy)
  }
}
