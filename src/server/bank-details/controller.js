/**
 * A GDS styled example bank details controller
 */

export const bankDetailsController = {
  handler: (_request, h) => {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    return h.view('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      bankdetails: translations['bank-details'],
      notificationHeading: translations['the-nominated-h'],
      yourlocal: translations['your-local'],
      important: translations['important'],
      currentLang,
      isConfirmed: false,
      translations,
      breadcrumbs: [
        {
          text: translations['laps-home'],
          href: '/'
        },
        {
          text: translations['bank-details'],
          href: '/'
        }
      ]
    })
  }
}
