export function registerLanguageExtension(server) {
  const allowed = new Set(['en', 'cy'])
  server.ext('onRequest', (request, h) => {
    const raw = request.query.lang
    if (raw) {
      const queryLang = raw.toLowerCase()
      if (!allowed.has(queryLang)) {
        // invalid lang → redirect
        const updatedQuery = { ...request.query, lang: 'en' }
        const qs = new URLSearchParams(updatedQuery).toString()
        const redirectTo = request.path + (qs ? `?${qs}` : '')
        h.state('locale', 'en')
        return h.redirect(redirectTo).takeover()
      }
      h.state('locale', queryLang) // update cookie
    }
    return h.continue
  })

  // onPreHandler → set values for handler usage
  server.ext('onPreHandler', (request, h) => {
    const allowed = new Set(['en', 'cy'])
    let currentLang

    // priority: URL → cookie → fallback
    const raw = request.query.lang
    if (raw && allowed.has(raw.toLowerCase())) {
      currentLang = raw.toLowerCase()
    } else if (allowed.has(request.state?.locale)) {
      currentLang = request.state.locale
    } else {
      currentLang = 'en'
    }

    request.app.currentLang = currentLang
    request.app.translations = request.i18n.getCatalog(currentLang) || {}
    return h.continue
  })
}
