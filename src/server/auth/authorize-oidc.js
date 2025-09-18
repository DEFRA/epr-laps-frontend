import { setUserSession } from './utils.js'

export const authorizeOIDCController = {
  method: ['GET', 'POST'],
  path: '/auth-response',
  options: {
    auth: { strategy: 'defra-id', mode: 'try' }
  },
  handler: async (request, h) => {
    if (request.auth?.isAuthenticated) {
      await setUserSession(request)

      request.logger.info('User has been successfully authenticated')

      request.logger.debug(
        `auth credentials ${JSON.stringify(request.auth.credentials)}`
      )
    }

    const redirect = request.yar.flash('referrer')?.at(0) ?? '/'

    return h.redirect(redirect)
  }
}
