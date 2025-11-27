const allowed = new Set(['en', 'cy'])
const fallback = 'en'

function normalizeLang(value) {
  if (typeof value !== 'string') {
    return null
  }
  const lang = value.trim().toLowerCase()
  return allowed.has(lang) ? lang : null
}

export function registerLanguageExtension(server) {
  server.ext('onRequest', (request, h) => {
    const lang = normalizeLang(request.query.lang)

    if (!lang && request.query.lang) {
      const updatedQuery = { ...request.query, lang: fallback }
      const qs = new URLSearchParams(updatedQuery).toString()
      h.state('locale', fallback)
      return h.redirect(`${request.path}?${qs}`).takeover()
    }

    if (lang) {
      h.state('locale', lang)
    }

    return h.continue
  })

  server.ext('onPreHandler', (request, h) => {
    const fromQuery = normalizeLang(request.query.lang)
    const fromCookie = normalizeLang(request.state?.locale)
    const currentLang = fromQuery || fromCookie || fallback

    request.app.currentLang = currentLang
    request.app.translations = request.i18n.getCatalog(currentLang) || {}

    return h.continue
  })
}
