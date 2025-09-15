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
      return h.redirect('/')
    }

    removeUserSession(request, request.auth.credentials)
    const referrer = request.headers.referer
    const { idToken } = userSession

    const logoutUrl = encodeURI(
      `${userSession.logoutUrl}?id_token_hint=${idToken}&post_logout_redirect_uri=${referrer}`
    )

    return h.redirect(logoutUrl)
  }
}
