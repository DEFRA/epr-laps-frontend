import { statusCodes } from '../constants/status-codes.js'

function statusCodeMessage(statusCode, translations) {
  switch (statusCode) {
    case statusCodes.notFound:
      return {
        heading: translations['page-not found'],
        message: translations['you-can-return']
      }
    case statusCodes.serviceUnavailable:
      return {
        heading: translations['service-unavailable'],
        message: translations['you-will-be']
      }
    case statusCodes.forbidden:
      return {
        heading: translations['forbidden'],
        message: translations['you-do']
      }
    case statusCodes.unauthorized:
      return {
        heading: translations['unauthorized'],
        message: translations['you-need-to']
      }
    default:
      return {
        heading: translations['service-problem'],
        message: translations['try-again']
      }
  }
}

export function catchAll(request, h, fallbackStatusCode = undefined) {
  const { response } = request

  // If not a Boom error and no fallback, continue
  if (!response?.isBoom && !fallbackStatusCode) {
    return h.continue
  }

  const translations = request.app?.translations || {}

  // Determine status code: use Boom's or fallback
  const statusCode = response?.output?.statusCode || fallbackStatusCode
  const { heading, message } = statusCodeMessage(statusCode, translations)

  if (statusCode >= statusCodes.internalServerError) {
    request.logger.error(response?.stack)
  }

  return h
    .view('error/index', {
      pageTitle: heading,
      heading,
      message
    })
    .code(statusCode)
}
