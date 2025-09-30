export const signOutController = {
  handler: (_request, h) => {
    const translations = _request.app?.translations || {}
    const currentLang = _request.app?.currentLang || 'en'

    return h.view('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council',
      currentLang,
      translations
    })
  }
}
