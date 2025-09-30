/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken } from '../../server/auth/utils.js'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'

      const localAuthority = request.auth.credentials.organisationName
      // Fetch bank details via the wrapper function
      const path = `/bank-details/${encodeURIComponent(localAuthority)}`
      const payload = await fetchWithToken(request, path)
      console.log('payload', payload)

      request.logger.info(
        `Successfully fetched bank details for ${localAuthority}`
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
      request.logger.error('Error fetching bank details:', error)

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

export const confirmBankDetailsController = {
  handler: async (request, h) => {
    const translations = request.app.translations || {}
    const currentLang = request.app.currentLang || 'en'

    const sessionId = request.state.userSession.sessionId
    const userSession = await request.server.app.cache.get(sessionId)
    console.log('USER session from confirm bank', userSession)
    const apiData = userSession?.apiData || null

    return h.view('bank-details/confirm-bank-details.njk', {
      pageTitle: 'Confirm Bank Details',
      currentLang,
      translations,
      apiData
    })
  }
}

export const bankDetailsConfirmedController = {
  handler: async (request, h) => {
    const translations = request.app.translations || {}
    const currentLang = request.app.currentLang || 'en'
    return h.view('bank-details/bank-details-confirmed.njk', {
      pageTitle: 'Confirm Bank Details',
      currentLang,
      translations
    })
  }
}
