import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export function registerLanguageExtension(server) {
  server.ext('onRequest', (request, h) => {
    const lang = request.query.lang || 'en'
    const filePath = path.join(
      __dirname,
      '../../../client/common/locales',
      lang,
      'translation.json'
    )

    try {
      request.app.translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch {
      request.app.translations = {}
    }

    request.app.currentLang = lang
    return h.continue
  })
}
