import path from 'path'
import HapiI18n from 'hapi-i18n'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Export the plugin as default or named
export const hapiI18n = {
  plugin: HapiI18n,
  options: {
    locales: ['en', 'cy'], // English and Welsh
    directory: path.join(__dirname, '../../../client/common/locales'),
    defaultLocale: 'en',
    cookieName: 'locale'
  }
}
