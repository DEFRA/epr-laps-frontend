/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken, putWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'

      const localAuthority = request.auth.credentials.organisationName
      // Fetch bank details via the wrapper function
      const path = `/bank-details/${encodeURIComponent(localAuthority)}`
      const payload = await fetchWithToken(request, path)
      request.app.apiData = payload
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

    const viewContext = await context(request)
    const isContinueEnabled = false

    return h.view('bank-details/confirm-bank-details.njk', {
      pageTitle: 'Confirm Bank Details',
      currentLang,
      translations,
      ...viewContext,
      isContinueEnabled
    })
  }
}

export const bankDetailsConfirmedController = {
  handler: async (request, h) => {
    const translations = request.app.translations || {}
    const currentLang = request.app.currentLang || 'en'
    const sessionId = request.state.userSession.sessionId
    const userSession = await request.server.app.cache.get(sessionId)
    const apiData = userSession?.apiData || null
    const localAuthority = request.auth.credentials.organisationName

    try {
      // Call reusable PUT function
      await putWithToken(
        request,
        `bank-details/${encodeURIComponent(localAuthority)}`,
        {
          id: apiData.id,
          accountName: apiData.accountName,
          sortCode: apiData.sortCode,
          accountNumber: apiData.accountNumber,
          confirmed: true
        }
      )

      // Redirect on success
      return h.redirect(
        `/bank-details/bank-details-confirmed?lang=${currentLang}`
      )
    } catch (err) {
      // Re-render the form with error
      return h.view('bank-details/confirm-bank-details.njk', {
        pageTitle: 'Confirm Bank Details',
        currentLang,
        translations,
        apiData,
        isContinueEnabled: true,
        error: 'Failed to update bank details. Please try again.'
      })
    }
  }
}
