import { removeUserSession } from '../common/helpers/auth/utils.js'

export const signOutController = {
  handler: (request, h) => {
    // If user session exists, remove it
    if (request?.state?.userSession) {
      const session = request.state.userSession
      removeUserSession(request, session)
    }

    return h.view('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council'
    })
  }
}
