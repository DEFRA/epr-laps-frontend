/**
 * A GDS styled example home page controller.
 */
import { context } from '../../config/nunjucks/context/context.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken } from '../../server/auth/utils.js'
const logger = createLogger()

export const homeController = {
  handler: async (request, h) => {
    try {
      request.app.context = await context(request)

      const roleName = request.app.context.authedUser.currentRole
      let payload = null
      console.log('THE ROLE NAME', roleName)

      if (roleName === 'Head of Finance') {
        const localAuthority = request.app.context.authedUser.organisationName
        // Fetch bank details via the wrapper function
        const path = `/bank-details/${encodeURIComponent(localAuthority)}`
        payload = await fetchWithToken(request, path)
        console.log('The payload>>', payload)
      }
      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'

      return h.view('home/index', {
        pageTitle: 'Home',
        currentLang,
        translations,
        breadcrumbs: [
          {
            text: translations['local-authority'],
            href: `/?lang=${currentLang}`
          }
        ],
        apiData: payload
      })
    } catch (error) {
      logger.error('Error fetching bank details:', error)

      // Handle unauthorized separately
      if (error.message === 'Unauthorized') {
        return h
          .response({ error: 'Unauthorized' })
          .code(statusCodes.unauthorized)
      }

      return h
        .response({ error: 'Failed to fetch bank details' })
        .code(statusCodes.internalServerError)
    }
  }
}
