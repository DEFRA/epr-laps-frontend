/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { createLogger } from '../../server/common/helpers/logging/logger.js'
import { fetchWithToken } from '../../server/auth/utils.js'

const logger = createLogger()

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'

      // Fetch bank details via the wrapper function
      const payload = await fetchWithToken(
        request,
        '/bank-details/:localAuthority'
      )

      return h.view('bank-details/index.njk', {
        pageTitle: 'Bank Details',
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
