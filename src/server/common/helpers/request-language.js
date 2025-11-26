import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerLanguageExtension(request, h) {
  const allowed = new Set(['en', 'cy'])
  const raw =
    (typeof request.query.lang === 'string' && request.query.lang.trim()) ||
    (typeof request.params?.locale === 'string' &&
      request.params.locale.trim()) ||
    ''

  const lang = raw.trim().toLowerCase()
  const currentLang = allowed.has(lang) ? lang : 'en'
  h.state('locale', currentLang)

  if (raw && !allowed.has(lang)) {
    const query = { ...request.query, lang: currentLang }
    const qs = new URLSearchParams(query).toString()
    const redirectTo = request.path + (qs ? `?${qs}` : '')

    return h.redirect(redirectTo).takeover()
  }

  const filePath = path.resolve(
    __dirname,
    '../../../client/common/locales',
    `${currentLang}.json`
  )

  try {
    request.app.translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (err) {
    request.logger.error(
      `Failed to load translations for "${currentLang}" from ${filePath}: ${err.message}`
    )
    request.app.translations = {}
  }

  request.app.currentLang = currentLang
  return h.continue
}
