/**
 * A GDS styled example get Payment documents controller
 */

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
