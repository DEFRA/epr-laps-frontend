/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken, putWithToken } from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const viewContext = await context(request)
      const { currentLang, translations } = viewContext

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
    const viewContext = await context(request)
    const { bankApiData, translations, currentLang } = viewContext

    const isContinueEnabled = false

    return h.view('bank-details/confirm-bank-details.njk', {
      pageTitle: 'Confirm Bank Details',
      currentLang,
      translations,
      bankApiData,
      isContinueEnabled
    })
  }
}

export const bankDetailsConfirmedController = {
  handler: async (request, h) => {
    const localAuthority = request.auth.credentials.organisationName
    let viewContext
    let currentLang

    try {
      viewContext = await context(request)
      const { bankApiData, currentLang: ctxCurrentLang } = viewContext

      currentLang = ctxCurrentLang

      // Call reusable PUT function
      await putWithToken(
        request,
        `bank-details/${encodeURIComponent(localAuthority)}`,
        {
          id: bankApiData.id,
          accountName: bankApiData.accountName,
          sortCode: bankApiData.sortCode,
          accountNumber: bankApiData.accountNumber,
          confirmed: true
        }
      )

      // Redirect on success
      return h.redirect(
        `/bank-details/bank-details-confirmed?lang=${currentLang}`
      )
    } catch (err) {
      request.logger.error('Failed to confirm bank details', err)
    }
  }
}
