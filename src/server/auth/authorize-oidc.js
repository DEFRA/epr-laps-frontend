import { setUserSession } from './utils.js'

export const authorizeOIDCController = {
  method: ['GET', 'POST'],
  path: '/auth-response',
  options: {
    auth: { strategy: 'defra-id', mode: 'try' }
  },
  handler: async (request, h) => {
    request.logger.debug(`Auth status: ${request.auth?.isAuthenticated}`)
    request.logger.debug(`Auth error: ${request.auth?.error}`)
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

    return h.redirect(redirect)
  }
}
