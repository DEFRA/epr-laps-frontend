import { removeUserSession } from '../common/helpers/auth/utils.js'

export const timedOutController = {
  handler: (request, h) => {
    //If user session exists, remove it
    if (request?.state?.userSession) {
      const session = request.state.userSession
      removeUserSession(request, session)
    }

    return h.view('timed-out/index.njk', {
      pageTitle: 'Session timed out'
    })
  }
}
