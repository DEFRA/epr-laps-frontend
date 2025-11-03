/**
 * A GDS styled example bank details controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import * as authUtils from '../../server/auth/utils.js'
import { context } from '../../config/nunjucks/context/context.js'
import joi from 'joi'

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
    const localAuthority = request.auth.credentials.organisationId
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

const ACCOUNT_NUMBER_MIN = 6
const ACCOUNT_NUMBER_MAX = 8

const buildSchema = (translations) =>
  joi.object({
    accountName: joi.string().max(256).required().messages({
      'string.empty': translations['accountName']
    }),
    sortCode: joi
      .string()
      .required()
      .pattern(/^(?=(?:\D*\d){6}$)[\d\s-]+$/)
      .max(8)
      .messages({
        'string.empty': translations['sortCodeEmpty'],
        'string.pattern.base': translations['sortCodePattern'],
        'string.lengthSix': translations['sortCodeLength']
      }),
    accountNumber: joi
      .string()
      .replace(/\s+/g, '')
      .required()
      .pattern(/^\d+$/, 'digits')
      .min(ACCOUNT_NUMBER_MIN)
      .max(ACCOUNT_NUMBER_MAX)
      .messages({
        'string.empty': translations['accountNumberEmpty'],
        'string.pattern.name': translations['accountNumberDigits'],
        'string.min': translations['accountNumberMin'],
        'string.max': translations['accountNumberMax']
      })
  })

export const getUpdateBankDetailsController = {
  handler: async (request, h) => {
    const { currentLang, translations } = request.app
    const payload = request.yar.get('payload') || {}
    const errors = {}
    const aggregatedErrors = []

    const referrer = request.headers.referer || ''
    const cameFromPost = referrer.includes(request.path)

    if (!cameFromPost) {
      request.yar.clear('payload')
      request.yar.set('formSubmitted', false)
    }

    if (request.yar.get('formSubmitted') === true) {
      const { error } = buildSchema(translations).validate(payload, {
        abortEarly: false
      })
      if (error?.details) {
        for (const detail of error.details) {
          errors[detail.context.key] = { text: detail.message }
          aggregatedErrors.push({
            text: detail.message,
            href: `#${detail.context.key}`
          })
        }
      }
    }

    return h.view('bank-details/update-bank-details.njk', {
      pageTitle: 'Update Bank Details',
      payload,
      errors,
      aggregatedErrors,
      currentLang,
      translations
    })
  }
}

export const postUpdateBankDetailsController = {
  handler: async (request, h) => {
    const { currentLang, translations } = request.app
    const payload = request.payload
    const schema = buildSchema(translations)
    const { error } = schema.validate(payload, { abortEarly: false })

    if (error?.details) {
      const errors = {}
      const aggregatedErrors = []

      for (const detail of error.details) {
        errors[detail.context.key] = { text: detail.message }
        aggregatedErrors.push({
          text: detail.message,
          href: `#${detail.context.key}`
        })
      }

      request.yar.set('payload', payload)
      request.yar.set('formSubmitted', true)

      return h
        .view('bank-details/update-bank-details.njk', {
          pageTitle: 'Update Bank Details',
          payload,
          errors,
          aggregatedErrors,
          currentLang,
          translations
        })
        .takeover()
    }

    request.yar.clear('payload')
    request.yar.set('formSubmitted', false)
    request.yar.set('visited', false)

    return h.redirect('/check-bank-details')
  }
}
