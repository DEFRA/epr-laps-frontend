/**
 * A GDS styled example bank details controller
 */

export const bankDetailsController = {
  handler: (_request, h) => {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    return h.view('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: translations['glamshire-count'] || 'Glamshire County Counci',
      bankdetails: translations['bank-details'] || 'Bank details',
      notificationHeading:
        translations['the-nominated-h'] ||
        "The nominated Head of Finance will need to confirm your local authority's bank details",
      yourlocal:
        translations['your-local'] || 'Your local authority bank details',
      currentLang,
      translations,
      breadcrumbs: [
        {
          text: translations['local-authority'] || 'LAPs home',
          href: '/'
        },
        {
          text: translations['bank-details'] || 'Bank details',
          href: '/'
        }
      ]
    })
  }
}
