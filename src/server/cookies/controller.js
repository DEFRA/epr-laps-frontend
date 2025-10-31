import { config } from '../../config/config.js'
import { formatDuration } from '../../server/auth/utils.js'

const cookiesController = {
  handler: (request, h) => {
    const { translations } = request.app
    const translationMap = {
      hours: translations['hours'] || 'hours',
      days: translations['days'] || 'days',
      years: translations['years'] || 'years',
      minutes: translations['minutes'] || 'minutes'
    }

    let sessionCookieExpiry = formatDuration(config.get('session.cookie.ttl'))
    for (const [en, translated] of Object.entries(translationMap)) {
      const regex = new RegExp(`\\b${en}\\b`, 'g')
      sessionCookieExpiry = sessionCookieExpiry.replace(regex, translated)
    }

    return h.view('cookies/index.njk', {
      sessionCookieExpiry,
      currentPath: request.path
    })
  }
}
export { cookiesController }
