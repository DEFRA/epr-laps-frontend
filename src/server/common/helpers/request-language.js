export function registerLanguageExtension(request, h) {
  const allowed = new Set(['en', 'cy'])
  const raw =
    (typeof request.query.lang === 'string' && request.query.lang.trim()) || ''
  const lang = raw.toLowerCase()
  const currentLang = allowed.has(lang) ? lang : 'en'

  h.state('locale', currentLang)

  if (raw && !allowed.has(lang)) {
    const query = { ...request.query, lang: currentLang }
    const qs = new URLSearchParams(query).toString()
    const redirectTo = request.path + (qs ? `?${qs}` : '')
    return h.redirect(redirectTo).takeover()
  }

  request.app.currentLang = currentLang
  request.app.translations = request.i18n.getCatalog(currentLang) || {}

  return h.continue
}
