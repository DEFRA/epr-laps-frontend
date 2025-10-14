import { removeUserSession } from '../common/helpers/auth/utils.js'

export const timedOutController = {
  handler: (request, h) => {
    // If user session exists, remove it
    if (request?.state?.userSession) {
      // Since auth is false for this route, we need to handle session removal differently
      try {
        const credentials = request.state?.userSession
        removeUserSession(request, credentials)
      } catch (error) {
        request.logger?.warn('Could not remove user session on timeout:', error)
      }
    }

    return h.view('timed-out/index.njk', {
      pageTitle: 'Timed out'
    })
  }
}
