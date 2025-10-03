/**
 * A GDS styled example get Payment documents controller
 */

export const paymentDocumentsController = {
  handler(_request, h) {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    return h.view('payment-documents/index.njk', {
      pageTitle: 'Payment documents',
      currentLang,
      breadcrumbs: [
        {
          text: translations['laps-home'],
          href: `/?lang=${currentLang}`
        },
        {
          text: translations['payment-documen'],
          href: `/payment-documents?lang=${currentLang}`
        }
      ]
    })
  }
}
