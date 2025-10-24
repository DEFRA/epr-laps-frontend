/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import * as authUtils from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      const viewContext = await context(request)
      const { bankApiData, translations, currentLang } = viewContext

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
        bankApiData
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
      await authUtils.putWithToken(
        request,
        `/bank-details/${encodeURIComponent(localAuthority)}`,
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
      request.logger.error(err, 'Failed to confirm bank details')
      return h
        .response({ error: 'Failed to fetch bank details' })
        .code(statusCodes.internalServerError)
    }
  }
}

export const updateBankDetailsInfoController = {
  handler: (_request, h) => {
    return h.view('bank-details/update-bank-details-info.njk', {
      pageTitle: 'How it works'
    })
  }
}

export const updateBankDetailsController = {
  handler: (_request, h) => {
    return h.view('bank-details/update-bank-details.njk', {
      pageTitle: 'Update Bank Details'
    })
  }
}
