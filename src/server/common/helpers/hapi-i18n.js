import path from 'node:path'
import HapiI18n from 'hapi-i18n'
import { fileURLToPath } from 'node:url'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Export the plugin as default or named
export const hapiI18nPlugin = {
  plugin: HapiI18n,
  options: {
    locales: ['en', 'cy'],
    directory: path.join(dirname, '../../../client/common/locales'),
    defaultLocale: 'en',
    cookieName: 'locale',
    objectNotation: true,
    extension: '.json',
    queryParameter: 'lang'
  }
}
