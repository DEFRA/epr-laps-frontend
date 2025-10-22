import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SUPPORTED_LOCALES = ['en', 'cy']

function normalizeLocale(raw) {
  if (!raw) return ''
  return String(raw).toLowerCase().split(/[-_]/)[0]
}

function loadTranslations(locale) {
  const filePath = path.join(
    __dirname,
    '../../../client/common/locales',
    locale,
    'translation.json'
  )
  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return null
  }
}

export function registerLanguageExtension(server) {
  server.ext('onRequest', (request, h) => {
    const raw = request.query?.lang ?? null
    const normalized = normalizeLocale(raw)
    const isSupported = SUPPORTED_LOCALES.includes(normalized)

    // If client explicitly provided an unsupported lang in the query, redirect to same path with lang=en
    if (raw && !isSupported) {
      const searchParams = new URLSearchParams(request.query || {})
      searchParams.set('lang', 'en')
      const newUrl = `${request.url.pathname || '/'}?${searchParams.toString()}`
      return h.redirect(newUrl).takeover()
    }

    const chosen = isSupported ? normalized : 'en'

    request.app = request.app || {}
    request.app.currentLang = chosen
    request.query = { ...(request.query || {}), lang: chosen }

    request.app.translations = loadTranslations(chosen) || {}

    return h.continue
  })
}
