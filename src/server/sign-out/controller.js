import { removeUserSession } from '../common/helpers/auth/utils.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const signOutController = {
  handler: (request, h) => {
    const langFromQuery = request.query?.lang?.trim().toLowerCase()
    const currentLang = langFromQuery || request.yar?.get('lang') || 'en'

    // Load translations
    let translations = {}
    try {
      const filePath = path.join(
        __dirname,
        '../../client/common/locales',
        currentLang,
        'translation.json'
      )
      translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    } catch (err) {
      request.logger.error(
        `Failed to load translations for "${currentLang}":`,
        err.message
      )
    }

    // Remove user session if exists
    if (request?.state?.userSession) {
      const session = request.state.userSession
      removeUserSession(request, session)
    }

    return h.view('sign-out/index.njk', { currentLang, translations })
  }
}
