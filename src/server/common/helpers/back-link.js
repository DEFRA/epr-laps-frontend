const COOKIE = 'nav'
const MAX_HISTORY = 20

export async function getBackLink(request, h) {
  const response = request.response

  // Only attach back link for HTML views
  if (!response || response.variety !== 'view') return h.continue

  // Current URL and key (without 'lang')
  const currentLang = request.query?.lang || 'en'
  const currentUrl = getUrl(request)
  const currentKey = stripLang(currentUrl)

  // Get or create navigation ID cookie
  let navid = request.state?.[COOKIE]
  if (!isValidId(navid)) {
    navid = generateId()
    h.state(COOKIE, navid, {
      path: '/',
      isHttpOnly: true,
      isSameSite: 'Lax',
      isSecure: false
    })
  }

  // Load or initialize history
  const cache = request.server.app.cache
  let history = (await cache.get(navid)) || []

  // Update history (push or trim if revisiting)
  history = updateHistory(history, currentKey, currentUrl)
  if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY)
  await cache.set(navid, history)

  // Compute previous page URL (back link)
  const backUrl = getPrevious(history, currentLang)

  // Attach back link to template context
  response.source.context = {
    ...response.source.context,
    backLinkUrl: backUrl
  }

  return h.continue
}

// Build full URL (path + sorted query)
export function getUrl(request) {
  const qs = new URLSearchParams(request.query || {})
  const queryString = qs.toString()
  return queryString ? `${request.path}?${queryString}` : request.path
}

// Remove 'lang' from URL to create a stable key
export function stripLang(url) {
  const [path, qs] = url.split('?')
  const params = new URLSearchParams(qs || '')
  params.delete('lang')
  const cleaned = params.toString()
  return cleaned ? `${path}?${cleaned}` : path
}

// Update history: add new page or trim forward history if revisiting
export function updateHistory(history, key, full) {
  const idx = history.findIndex((h) => h.key === key)
  return idx >= 0 ? history.slice(0, idx + 1) : [...history, { key, full }]
}

// Compute back link (previous page) and ensure correct 'lang'
export function getPrevious(history, lang) {
  if (history.length <= 1) return `/?lang=${lang}`

  const prevUrl = history[history.length - 2].full
  const [path, qs] = prevUrl.split('?')
  const params = new URLSearchParams(qs || '')
  params.set('lang', lang)
  return `${path}?${params.toString()}`
}

// Generate a random small ID
export function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

// Validate cookie ID
export function isValidId(id) {
  return typeof id === 'string' && /^[a-z0-9]{6,16}$/i.test(id)
}
