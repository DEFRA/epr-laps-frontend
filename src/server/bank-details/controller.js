/**
 * A GDS styled example bank details controller
 */

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
