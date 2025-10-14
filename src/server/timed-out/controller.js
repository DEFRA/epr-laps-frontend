import { removeUserSession } from '../common/helpers/auth/utils.js'

export const timedOutController = {
  handler: (request, h) => {
    // If user session exists, remove it
    if (request?.state?.userSession) {
      const credentials = request.auth?.credentials
      removeUserSession(request, credentials)
    }

    return h.view('timed-out/index.njk', {
      pageTitle: 'Timed out'
    })
  }
}
