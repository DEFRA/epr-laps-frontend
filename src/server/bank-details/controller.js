/**
 * A GDS styled example bank details controller
 */
import * as authUtils from '../../server/auth/utils.js'
import joi from 'joi'
import Boom from '@hapi/boom'

const ACCOUNT_NUMBER_MIN = 6
const ACCOUNT_NUMBER_MAX = 8

export const bankDetailsController = {
  handler: async (request, h) => {
    const { currentLang, translations } = request.app

    const bankApiData = request.yar.get('bankDetails')

    if (!bankApiData) {
      throw Boom.internal('Bank details not found in session')
    }

    const translatedSortCode = translateBankDetails(
      bankApiData.sortCode,
      translations
    )
    const translatedAccountNumber = translateBankDetails(
      bankApiData.accountNumber,
      translations
    )
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
      userPermissions,
      translatedSortCode,
      translatedAccountNumber
    })
  }
}

/**
 * Formats a bank detail (sort code or account number) for display.
 *
 * - Shows the full value as-is unless it already includes "ending with".
 * - Only translates "ending with" if it exists in the string.
 *
 * @param {string} value - The raw sort code or account number.
 * @param {object} translations - The translations object (must include "ending-with").
 * @returns {string} Formatted string suitable for UI display.
 */
export function translateBankDetails(value, translations) {
  if (!value || typeof value !== 'string') {
    return ''
  }

  const trimmed = value.trim()
  const endingWithTranslation = translations['ending-with']

  if (/ending with/i.test(trimmed)) {
    return trimmed.replace(/ending with/i, endingWithTranslation)
  }

  return trimmed
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
  handler: (request, h) => {
    const currentLang = request.app.currentLang
    return h.view('bank-details/update-bank-details-info.njk', {
      pageTitle: 'How it works',
      currentLang
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

export const checkBankDetailsController = {
  handler: (request, h) => {
    const newBankDetails = request.yar.get('payload')

    if (!newBankDetails) {
      return h.redirect('bank-details/update-bank-details')
    }

    newBankDetails.requesterName = request.auth.credentials.displayName
    newBankDetails.localAuthority = request.auth.credentials.organisationName

    request.yar.set('ConfirmedBankDetails', newBankDetails)
    return h.view('bank-details/check-bank-details.njk', {
      pageTitle: 'Confirm new bank account details',
      newBankDetails
    })
  }
}

export const postBankDetailsController = {
  handler: async (request, h) => {
    const { currentLang } = request.app
    const payload = request.yar.get('ConfirmedBankDetails')

    if (!payload) {
      return h.redirect('bank-details/update-bank-details')
    }

    // Make your API call
    await authUtils.postWithToken(request, '/bank-details', payload)

    request.logger.info(
      `Bank details successfully posted for organisation: ${request.auth.credentials.organisationName}`
    )

    // Set session flag to allow access to submitted page
    request.yar.set('bankDetailsSubmitted', true)

    request.yar.clear('ConfirmedBankDetails')
    request.yar.clear('payload')

    // Redirect on success
    return h.redirect(
      `/bank-details/bank-details-submitted?lang=${currentLang}`
    )
  }
}

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

    request.yar.set('payload', payload)
    request.yar.set('formSubmitted', false)
    request.yar.set('visited', false)

    return h.redirect('bank-details/check-bank-details')
  }
}
