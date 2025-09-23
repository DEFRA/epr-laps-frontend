/**
 * A GDS styled example home page controller.
 */
export const homeController = {
  handler: async (_request, h) => {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    const sessionId = _request.state.userSession?.sessionId
    let userSession = null

    if (sessionId) {
      userSession = await _request.server.app.cache.get(sessionId)
    }

    const laName = userSession?.organisationName || 'Local Authority'

    return h.view('home/index', {
      pageTitle: 'Home',
      currentLang,
      heading: laName,
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
