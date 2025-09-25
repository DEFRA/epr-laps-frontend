/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { fetchWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

const logger = createLogger()

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'

      request.app.context = await context(request)

      const localAuthority = request.app.context.organisationName
      // Fetch bank details via the wrapper function
      const path = `/bank-details/${encodeURIComponent(localAuthority)}`
      const payload = await fetchWithToken(request, path)

      return h.view('bank-details/index.njk', {
        pageTitle: 'Bank Details',
        heading: 'Glamshire County Council',
        currentLang,
        translations,
        breadcrumbs: [
          {
            text: translations['laps-home'],
            href: `/?lang=${currentLang}`
          },
          {
            text: translations['bank-details'],
            href: `/bank-details?lang=${currentLang}`
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
