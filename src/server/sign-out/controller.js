import { removeUserSession } from '../common/helpers/auth/utils.js'

export const signOutController = {
  handler: (request, h) => {
    // If user session exists, remove it
    if (request?.state?.userSession) {
      removeUserSession(request)
    }

    return h.view('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council'
    })
  }
}
