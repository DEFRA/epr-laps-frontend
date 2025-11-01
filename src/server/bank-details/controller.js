/**
 * A GDS styled example bank details controller
 */
import * as authUtils from '../../server/auth/utils.js'
import Boom from '@hapi/boom'

export const bankDetailsController = {
  handler: async (request, h) => {
    const { currentLang, translations } = request.app

    const bankApiData = request.yar.get('bankDetails')
    if (!bankApiData) {
      throw Boom.internal('Bank details not found in session')
    }
    const userPermissions = request.yar.get('userPermissions')

    request.logger.info('successfully fetched bank details from cookie')

    return h.view('bank-details/index.njk', {
      pageTitle: 'Bank Details',
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
      bankApiData,
      userPermissions
    })
  }
}

export const confirmBankDetailsController = {
  handler: async (request, h) => {
    const bankApiData = request.yar.get('bankDetails')
    if (!bankApiData) {
      request.logger.error('failed to load bank details in from cookie')
      throw Boom.internal('Bank Api Data not')
    }

    const isContinueEnabled = false
    return h.view('bank-details/confirm-bank-details.njk', {
      pageTitle: 'Confirm Bank Details',
      bankApiData,
      isContinueEnabled
    })
  }
}

export const bankDetailsConfirmedController = {
  handler: async (request, h) => {
    const localAuthority = request.auth.credentials.organisationId
    const { currentLang } = request.app
    const bankApiData = request.yar.get('bankDetails')

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

    request.logger.info('bank details successfully confirmed')
    // Redirect on success
    return h.redirect(
      `/bank-details/bank-details-confirmed?lang=${currentLang}`
    )
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

export const bankDetailsSubmittedController = {
  handler: async (request, h) => {
    const { currentLang } = request.app
    // Check if user arrived from a valid submission (check for specific session flag)
    const validSubmission = request.yar.get('bankDetailsSubmitted')

    if (!validSubmission) {
      return h.redirect(
        `/bank-details/update-bank-details-info?lang=${currentLang}`
      )
    }
    // Clear the session flag to prevent refresh/back button issues
    request.yar.clear('bankDetailsSubmitted')
    return h.view('bank-details/bank-details-submitted.njk', {
      pageTitle: 'Bank details submitted'
    })
  }
}

const accountName = 'Defra Test'
export const checkBankDetailsController = {
  handler: (_request, h) => {
    // TODO: Get this from where previous page saved it
    const newBankDetails = {
      id: '12345-abcde-67890-fghij',
      accountNumber: '094785923',
      accountName,
      sortCode: '09-03-023',
      requestedBy: 'Juhi'
    }
    return h.view('bank-details/check-bank-details.njk', {
      pageTitle: 'Confirm new bank account details',
      newBankDetails
    })
  }
}

export const postBankDetailsController = {
  handler: async (request, h) => {
    // TODO: Get payload from previous page
    const { currentLang } = request.app

    // Make your API call
    await authUtils.postWithToken(request, '/bank-details', {
      accountNumber: '094785923',
      accountName,
      sortCode: '09-03-023',
      requesterName: 'Juhi',
      localAuthority: request.auth.credentials.organisationName
    })

    request.logger.info(
      `Bank details successfully posted for organisation: ${request.auth.credentials.organisationName}`
    )

    // Set session flag to allow access to submitted page
    request.yar.set('bankDetailsSubmitted', true)

    // Redirect on success
    return h.redirect(
      `/bank-details/bank-details-submitted?lang=${currentLang}`
    )
  }
}
