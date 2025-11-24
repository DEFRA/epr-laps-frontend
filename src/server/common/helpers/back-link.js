const MAX_HISTORY = 20

export function getBackLink(server) {
  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    if (response.variety !== 'view') {
      return h.continue
    }

    const urlObj = request.url || {}
    const currentUrl = urlObj.href || urlObj.pathname || ''
    const currentLang = request.query?.lang || 'en'

    // Load history
    let history = request.yar.get('history') || []

    const currentKey = stripForKey(currentUrl)

    // If key is empty → default back link only
    if (!currentKey) {
      response.source.context = {
        ...response.source.context,
        backLinkUrl: `/?lang=${currentLang}`
      }
      return h.continue
    }

    const idx = history.findIndex((x) => x.key === currentKey)
    history =
      idx >= 0
        ? history.slice(0, idx + 1)
        : [...history, { key: currentKey, full: currentUrl }]

    // Keep last 20 entries
    const over = history.length - MAX_HISTORY
    if (over > 0) {
      history = history.slice(over)
    }

    request.yar.set('history', history)

    // Default backlink
    let backLinkUrl = `/?lang=${currentLang}`

    // Compute previous link safely (flat logic)
    const prev = history.length > 1 ? history.at(-2) : null

    if (prev?.full) {
      const cleaned = prev.full.replace(/^https?:\/\/[^/]+/, '')
      const [path, qs] = cleaned.split('?')
      const params = new URLSearchParams(qs || '')
      params.set('lang', currentLang)
      backLinkUrl = `${path}?${params.toString()}`
    }

    response.source.context = {
      ...response.source.context,
      backLinkUrl
    }

    return h.continue
  })
}

export function stripForKey(url) {
  if (!url) return ''

  const noDomain = url.replace(/^https?:\/\/[^/]+/, '')
  const [path, qs] = noDomain.split('?')
  const params = new URLSearchParams(qs || '')

  params.delete('lang')

  const q = params.toString()
  return q ? `${path}?${q}` : path
}
