import { setLocaleCookie } from './cookies.js'

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
  server.ext('onPreAuth', (request, h) => {
    const rawLang = request.query.lang
    const lang = normalizeLang(rawLang)

    if (!lang && rawLang) {
      const updatedQuery = { ...request.query, lang: fallback }
      const qs = new URLSearchParams(updatedQuery).toString()
      setLocaleCookie(h, fallback)
      return h.redirect(`${request.path}?${qs}`).takeover()
    }

    if (lang) {
      setLocaleCookie(h, lang)
    }

    const fromQuery = lang
    const fromCookie = normalizeLang(request.state?.locale)
    const currentLang = fromQuery || fromCookie || fallback

    request.app.currentLang = currentLang
    request.app.translations = request.i18n.getCatalog(currentLang) || {}

    return h.continue
  })
}
