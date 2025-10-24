import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerLanguageExtension(server) {
  const allowed = new Set(['en', 'cy'])

  server.ext('onRequest', (request, h) => {
    const raw =
      request.query && typeof request.query.lang === 'string'
        ? request.query.lang
        : ''
    const lang = raw.trim().toLowerCase()
    const currentLang = allowed.has(lang) ? lang : 'en'

    if (raw && !allowed.has(lang)) {
      const query = { ...request.query, lang: currentLang }
      const qs = new URLSearchParams(query).toString()
      const redirectTo = request.path + (qs ? `?${qs}` : '')

      return h.redirect(redirectTo).takeover()
    }

    const filePath = path.join(
      __dirname,
      '../../../client/common/locales',
      currentLang,
      'translation.json'
    )

    try {
      request.app.translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (err) {
      request.app.translations = {}
    }

    request.app.currentLang = currentLang
    return h.continue
  })
}
