export function getBackLink(server) {
  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    if (response.variety === 'view') {
      // If for some reason href is missing, fallback to pathname
      const currentUrl = request.url.href || request.url.pathname
      const currentLang = request.query.lang || 'en'

      // Remove domain + strip lang → used for comparison only
      const stripForKey = (url) => {
        if (!url) return '' // safety

        const noDomain = url.replace(/^https?:\/\/[^/]+/, '')
        const [path, qs] = noDomain.split('?')

        const params = new URLSearchParams(qs || '')
        params.delete('lang')

        const cleaned = params.toString()
        return cleaned ? `${path}?${cleaned}` : path
      }

      const currentKey = stripForKey(currentUrl)

      // Get history
      let history = request.yar.get('history') || []

      // Find if this page (ignoring lang) already exists
      const existingIndex = history.findIndex((h) => h.key === currentKey)

      if (existingIndex !== -1) {
        history = history.slice(0, existingIndex + 1)
      } else {
        history.push({
          key: currentKey,
          full: currentUrl // full URL ALWAYS stored
        })
      }

      // Limit size
      if (history.length > 20) history.shift()

      request.yar.set('history', history)

      // Default backlink
      let backLinkUrl = `/?lang=${currentLang}`

      if (history.length >= 2) {
        const prev = history[history.length - 2]

        if (prev && prev.full) {
          const cleanedPrev = prev.full.replace(/^https?:\/\/[^/]+/, '')
          const [path, qs] = cleanedPrev.split('?')

          const params = new URLSearchParams(qs || '')
          params.set('lang', currentLang)

          const qsOut = params.toString()
          backLinkUrl = qsOut
            ? `${path}?${qsOut}`
            : `${path}?lang=${currentLang}`
        }
      }

      // Inject into view context
      response.source.context = {
        ...response.source.context,
        backLinkUrl
      }
    }

    return h.continue
  })
}
