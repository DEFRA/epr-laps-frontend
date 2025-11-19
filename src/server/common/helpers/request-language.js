import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerLanguageExtension(server) {
  const allowed = new Set(['en', 'cy'])

  // 1️⃣ Decide language early (before route handlers)
  server.ext('onPreHandler', (request, h) => {
    const queryLang =
      request.query && typeof request.query.lang === 'string'
        ? request.query.lang
        : ''

    const cookieLang =
      !queryLang && request.state?.lang ? request.state.lang : ''

    const raw = queryLang || cookieLang || ''
    const lang = raw.trim().toLowerCase()
    const currentLang = allowed.has(lang) ? lang : 'en'

    // Load translation JSON
    const filePath = path.join(
      __dirname,
      '../../../client/common/locales',
      currentLang,
      'translation.json'
    )

    try {
      request.app.translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
      request.app.translations = {}
    }

    request.app.currentLang = currentLang
    return h.continue
  })

  // 2️⃣ Set/update cookie AFTER route handler has built a response
  server.ext('onPreResponse', (request, h) => {
    const currentLang = request.app.currentLang || 'en'

    h.state('lang', currentLang, {
      ttl: 1000 * 60 * 60 * 24 * 365,
      isSecure: false, // IMPORTANT for localhost
      isHttpOnly: false,
      path: '/'
    })

    return h.continue
  })
}
