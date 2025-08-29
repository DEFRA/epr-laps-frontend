// import { statusCodes } from '../common/constants/status-codes.js'

// /**
//  * A generic health-check endpoint. Used by the platform to check if the service is up and handling requests.
//  */
// export const bankDetailsController = {
//   handler(_request, h) {
//     return h.response({ message: 'success' }).code(statusCodes.ok)
//   }
// }

export const bankDetailsController = {
  handler: (request, h) => {
    return h.view('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        },
        {
          text: 'Bank details'
        }
      ]
    })
  }
}
