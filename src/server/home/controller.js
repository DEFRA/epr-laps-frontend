/**
 * A GDS styled example home page controller.
 */
export const homeController = {
  handler: (_request, h) => {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    return h.view('home/index', {
      pageTitle: 'Home',
      currentLang,
      translations,
      breadcrumbs: [
        {
          text: translations['local-authority'],
          href: `/?lang=${currentLang}`
        }
      ]
    })
  }
}
