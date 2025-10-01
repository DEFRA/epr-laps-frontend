import {
  getUserSession,
  removeUserSession
} from '../common/helpers/auth/utils.js'

export const signOutController = {
  method: 'GET',
  path: '/sign-out',
  handler: async (request, h) => {
    const userSession = await getUserSession(request, request.auth.credentials)

    if (!userSession) {
      request.logger.info('No active user session. Redirecting to home page')
      return h.redirect('/')
    }

    removeUserSession(request, request.auth.credentials)
    const referrer = request.headers.referer
    const { idToken } = userSession
    request.logger.info('User session removed. Signing user out of Defra ID')
    const logoutUrl = encodeURI(
      `${userSession.logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${referrer}logout`
    )

    request.logger.debug(`Redirecting user to: ${logoutUrl}`)
    return h.redirect(logoutUrl)
  }
}
