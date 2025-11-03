import {
  getUserSession,
  removeUserSession
} from '../common/helpers/auth/utils.js'
import { config } from '../../config/config.js'

export const signOutController = {
  method: 'GET',
  path: '/sign-out',
  handler: async (request, h) => {
    const userSession = await getUserSession(request, request.auth.credentials)

    const currentLang = request.app.currentLang
    if (!userSession) {
      request.logger.info('No active user session. Redirecting to home page')
      return h.redirect('/')
    }

    removeUserSession(request, request.auth.credentials)
    const { idToken } = userSession
    request.logger.info('User session removed. Signing user out of Defra ID')
    // Always use fallback URL from config
    const fallbackUrl = config.get('defraId.redirectUrl').replace(/\/$/, '') // remove trailing slash if present

    const logoutUrl = encodeURI(
      `${userSession.logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${fallbackUrl}/logout?lang=${currentLang}`
    )

    request.logger.debug(`Redirecting user to: ${logoutUrl}`)
    return h.redirect(logoutUrl)
  }
}
