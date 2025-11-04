import { config } from '../../config/config.js'
import { formatDuration } from '../../server/auth/utils.js'

const cookiesController = {
  handler: (request, h) => {
    const sessionCookieExpiry = formatDuration(config.get('session.cookie.ttl'))
    return h.view('cookies/index.njk', {
      sessionCookieExpiry,
      currentPath: request.path
    })
  }
}
export { cookiesController }
