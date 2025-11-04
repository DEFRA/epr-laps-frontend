import { config } from '../../config/config.js'
import { formatDuration } from '../../server/auth/utils.js'

const cookiesController = {
  handler: (_request, h) => {
    const sessionCookieExpiry = formatDuration(config.get('session.cookie.ttl'))
    return h.view('cookies/index.njk', { sessionCookieExpiry })
  }
}
export { cookiesController }
