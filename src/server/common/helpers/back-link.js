const MAX_HISTORY = 20
const PREVIOUS_HISTORY_INDEX = -2

export function getBackLink(server) {
  server.ext('onPreResponse', (request, h) => {
    const response = request.response
    if (response.variety !== 'view') return h.continue

    const currentUrl = getCurrentUrl(request)
    const currentLang = request.query?.lang || 'en'
    let history = request.yar.get('history') || []
    const currentKey = stripForKey(currentUrl)

    if (!currentKey) {
      setBackLink(response, `/?lang=${currentLang}`)
      return h.continue
    }

    history = updateHistory(history, currentKey, currentUrl)
    history = trimHistory(history)

    request.yar.set('history', history)

    const backLinkUrl = computeBackLink(history, currentLang)
    setBackLink(response, backLinkUrl)

    return h.continue
  })
}

// Helpers
function getCurrentUrl(request) {
  const urlObj = request.url || {}
  return urlObj.href || urlObj.pathname || ''
}

function setBackLink(response, url) {
  response.source.context = {
    ...response.source.context,
    backLinkUrl: url
  }
}

function updateHistory(history, currentKey, currentUrl) {
  const idx = history.findIndex((x) => x.key === currentKey)
  return idx >= 0
    ? history.slice(0, idx + 1)
    : [...history, { key: currentKey, full: currentUrl }]
}

function trimHistory(history) {
  const over = history.length - MAX_HISTORY
  return over > 0 ? history.slice(over) : history
}

function computeBackLink(history, lang) {
  if (history.length <= 1) return `/?lang=${lang}`

  const prev = history.at(PREVIOUS_HISTORY_INDEX)
  if (!prev?.full) return `/?lang=${lang}`

  const cleaned = prev.full.replace(/^https?:\/\/[^/]+/, '')
  const [path, qs] = cleaned.split('?')
  const params = new URLSearchParams(qs || '')
  params.set('lang', lang)
  return `${path}?${params.toString()}`
}

export function stripForKey(url) {
  if (!url) {
    return ''
  }

  const noDomain = url.replace(/^https?:\/\/[^/]+/, '')
  const [path, qs] = noDomain.split('?')
  const params = new URLSearchParams(qs || '')

  params.delete('lang')

  const q = params.toString()
  return q ? `${path}?${q}` : path
}
