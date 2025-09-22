/**
 * A GDS styled example bank details controller
 */
export const bankDetailsController = {
  handler: (request, h) => {
    const translations = request.app.translations || {}
    const currentLang = request.app.currentLang || 'en'

    return h.view('bank-details/index.njk', {
      pageTitle: 'Bank Details',
      heading: 'Glamshire County Council',
      important: translations['important'],
      currentLang,
      isConfirmed: false,
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
      ]
    })
  }
}
