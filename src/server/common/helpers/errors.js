import { statusCodes } from '../constants/status-codes.js'

function statusCodeMessage(statusCode) {
  switch (statusCode) {
    case statusCodes.notFound:
      return {
        heading: 'Page not found',
        message: 'You can return to the GOV.UK website.'
      }
    case statusCodes.serviceUnavailable:
      return {
        heading: 'Sorry, the service is currently unavailable',
        message: 'You will be able to use the service soon.'
      }
    case statusCodes.forbidden:
      return {
        heading: 'Forbidden',
        message: 'You do not have permission to access this page.'
      }
    case statusCodes.unauthorized:
      return {
        heading: 'Unauthorized',
        message: 'You need to sign in to view this page.'
      }
    default:
      return {
        heading: 'Sorry, there is a problem with the service',
        message: 'Try again later.'
      }
  }
}

export function catchAll(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }
  console.log('Error handler invoked', response)
  const statusCode = response.output.statusCode
  const { heading, message } = statusCodeMessage(statusCode)

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
