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

export const updateBankDetailsController = {
  handler: (_request, h) => {
    return h.view('bank-details/update-bank-details.njk', {
      pageTitle: 'Update Bank Details'
    })
  }
}

export const newBankDetailsConfirmedController = {
  handler: (_request, h) => {
    // TODO: Get this from where previous page saved it
    const newBankDetails = {
      id: '12345-abcde-67890-fghij',
      accountNumber: '094785923',
      accountName: 'Defra Test',
      sortCode: '09-03-023',
      requestedBy: 'Juhi'
    }
    return h.view('bank-details/confirm-new-bank-details.njk', {
      pageTitle: 'Confirm new bank account details',
      newBankDetails
    })
  }
}

export const postBankDetailsController = {
  handler: async (request, h) => {
    // const localAuthority = request.auth.credentials.organisationName
    let viewContext
    let currentLang

    try {
      viewContext = await context(request)
      const { currentLang: ctxCurrentLang } = viewContext
      currentLang = ctxCurrentLang

      // const { id, accountName, sortCode, accountNumber, requestedBy } = request.payload

      // Make your API call
      await authUtils.postWithToken(request, '/bank-details', {
        accountNumber: '094785923',
        accountName: 'Defra Test',
        sortCode: '09-03-023',
        requesterName: 'Juhi',
        localAuthority: 'Defra Test'
      })

      // Redirect on success
      return h.redirect(
        `/bank-details/bank-details-created?lang=${currentLang}`
      )
    } catch (err) {
      request.logger.error(err, 'Failed to create bank details')
      return h
        .response({ error: 'Failed to create bank details' })
        .code(statusCodes.internalServerError)
    }
  }
}
