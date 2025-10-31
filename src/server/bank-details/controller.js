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

const getTranslations = (lang) => {
  const translations = {
    en: {
      accountName: 'Enter account name',
      sortCodeEmpty: 'Enter the sort code',
      sortCodePattern: 'Enter a valid sort code like 309430',
      sortCodeLength: 'Sort code must be 6 digits long',
      accountNumberEmpty: 'Enter the account number',
      accountNumberDigits: 'Enter a valid account number like 12345678',
      accountNumberMin: 'Account number must be at least 6 digits long',
      accountNumberMax: 'Account number must be no more than 8 digits long',
      pageTitle: 'Update Bank Details'
    },
    cy: {
      accountName: 'Rhowch enw’r cyfrif',
      sortCodeEmpty: 'Rhowch y cod didoli',
      sortCodePattern: 'Rhowch god didoli dilys fel 309430',
      sortCodeLength: 'Rhaid i’r cod didoli fod yn 6 digid o hyd',
      accountNumberEmpty: 'Rhowch rif y cyfrif',
      accountNumberDigits: 'Rhowch rif cyfrif dilys fel 12345678',
      accountNumberMin: 'Rhaid i rif y cyfrif fod o leiaf 6 digid o hyd',
      accountNumberMax: 'Rhaid i rif y cyfrif fod dim mwy na 8 digid o hyd',
      pageTitle: 'Diweddaru Manylion Banc'
    }
  }
  return translations[lang]
}

const SORT_CODE_LENGTH = 6
const ACCOUNT_NUMBER_MIN = 6
const ACCOUNT_NUMBER_MAX = 8

const buildSchema = (t) =>
  joi.object({
    accountName: joi.string().max(256).required().messages({
      'string.empty': t.accountName
    }),
    sortCode: joi
      .string()
      .required()
      .pattern(/^\d+$/)
      .custom((value, helpers) => {
        const clean = value.replace(/[-\s]/g, '')
        if (clean.length !== SORT_CODE_LENGTH) {
          return helpers.error('string.lengthSix')
        }
        return value
      })
      .messages({
        'string.empty': t.sortCodeEmpty,
        'string.pattern.base': t.sortCodePattern,
        'string.lengthSix': t.sortCodeLength
      }),
    accountNumber: joi
      .string()
      .required()
      .custom((value, helpers) => {
        const clean = value.replaceAll(' ', '')
        if (!clean) {
          return helpers.error('string.empty')
        }
        if (!/^\d+$/.test(clean)) {
          return helpers.error('string.digits')
        }
        if (clean.length < ACCOUNT_NUMBER_MIN) {
          return helpers.error('string.minSix')
        }
        if (clean.length > ACCOUNT_NUMBER_MAX) {
          return helpers.error('string.maxEight')
        }
        return value
      })
      .messages({
        'string.empty': t.accountNumberEmpty,
        'string.digits': t.accountNumberDigits,
        'string.minSix': t.accountNumberMin,
        'string.maxEight': t.accountNumberMax
      })
  })

export const getUpdateBankDetailsController = {
  handler: async (request, h) => {
    const lang = request.query.lang || 'en'
    request.yar.set('lang', lang)

    const t = getTranslations(lang)

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
      const { error } = buildSchema(t).validate(payload, { abortEarly: false })
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
      t
    })
  }
}

export const postUpdateBankDetailsController = {
  options: {
    validate: {
      payload: joi.object({}), // placeholder
      failAction: async (request, h) => {
        const lang = request.yar.get('lang') || 'en'
        const t = getTranslations(lang)
        const schema = buildSchema(t)

        const { error } = schema.validate(request.payload, {
          abortEarly: false
        })

        const errors = {}
        const aggregatedErrors = []

        if (error?.details) {
          for (const detail of error.details) {
            errors[detail.context.key] = { text: detail.message }
            aggregatedErrors.push({
              text: detail.message,
              href: `#${detail.context.key}`
            })
          }
        }

        // Store payload and mark form as submitted
        request.yar.set('payload', request.payload)
        request.yar.set('formSubmitted', true)

        return h
          .view('bank-details/update-bank-details.njk', {
            payload: request.payload,
            errors,
            aggregatedErrors,
            t
          })
          .takeover()
      }
    }
  },
  handler: (request, h) => {
    request.yar.clear('payload')
    request.yar.set('formSubmitted', false)
    request.yar.set('visited', false)

    // Redirect to check-bank-details
    return h.redirect('/check-bank-details')
  }
}
