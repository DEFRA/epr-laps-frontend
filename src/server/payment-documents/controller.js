// import { statusCodes } from '../common/constants/status-codes.js'

// /**
//  * A generic health-check endpoint. Used by the platform to check if the service is up and handling requests.
//  */
// export const bankDetailsController = {
//   handler(_request, h) {
//     return h.response({ message: 'success' }).code(statusCodes.ok)
//   }
// }

export const paymentDocumentsController = {
  handler(_request, h) {
    const translations = _request.app.translations || {}
    // const currentLang = _request.app.currentLang || 'en'
    return h.view('payment-documents/index.njk', {
      pageTitle: 'Glamshire County Council',
      heading: translations['local-authority'] || 'local-authority',
      caption: translations['glamshire-count'] || 'glamshire-count',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        },
        {
          text: 'Payment documents'
        }
      ]
    })
  }
}
