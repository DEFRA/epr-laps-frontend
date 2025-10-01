import { removeUserSession } from '../common/helpers/auth/utils.js'

export const signOutController = {
  handler: async (request, h) => {
    // If user session exists, remove it
    if (request?.state?.userSession) {
      await removeUserSession(request)
    }

    return h.view('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council'
    })
  }
}
