import path from 'path'
import hapi from '@hapi/hapi'
import HapiI18n from 'hapi-i18n'
import { router } from './router.js'
import { config } from '../config/config.js'
import { pulse } from './common/helpers/pulse.js'
import { catchAll } from './common/helpers/errors.js'
import { nunjucksConfig } from '../config/nunjucks/nunjucks.js'
import { setupProxy } from './common/helpers/proxy/setup-proxy.js'
import { requestTracing } from './common/helpers/request-tracing.js'
import { requestLogger } from './common/helpers/logging/request-logger.js'
import { sessionCache } from './common/helpers/session-cache/session-cache.js'
import { getCacheEngine } from './common/helpers/session-cache/cache-engine.js'
import { secureContext } from '@defra/hapi-secure-context'
import { fileURLToPath } from 'url'
import fs from 'fs'

// Current file path
const __filename = fileURLToPath(import.meta.url)

// Current directory path (equivalent to __dirname)
const __dirname = path.dirname(__filename)

export async function createServer() {
  setupProxy()
  // const i18n = await initI18n()
  const server = hapi.server({
    host: config.get('host'),
    port: config.get('port'),
    routes: {
      validate: {
        options: {
          abortEarly: false
        }
      },
      files: {
        relativeTo: path.resolve(config.get('root'), '.public')
      },
      security: {
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: false
        },
        xss: 'enabled',
        noSniff: true,
        xframe: true
      }
    },
    router: {
      stripTrailingSlash: true
    },
    cache: [
      {
        name: config.get('session.cache.name'),
        engine: getCacheEngine(config.get('session.cache.engine'))
      }
    ],
    state: {
      strictHeader: false
    }
  })

  await server.register({
    plugin: HapiI18n,
    options: {
      locales: ['en', 'cy'], // English and Welsh
      directory: path.join(__dirname, '../client/common/locales'),
      defaultLocale: 'en',
      cookieName: 'locale'
    }
  })

  server.ext('onRequest', (request, h) => {
    const lang = request.query.lang || 'en'
    const filePath = path.join(
      __dirname,
      '../client/common/locales',
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

  // Attach i18n translator to each request
  // server.ext('onRequest', (request, h) => {
  //   const lang = request.query.lang || request.headers['accept-language']?.split(',')[0] || 'en'
  //   request.i18n = i18n.cloneInstance({ lng: lang })
  //   request.language = lang // useful in templates
  //   return h.continue
  // })
  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    nunjucksConfig,
    router // Register all the controllers/routes defined in src/server/router.js
  ])

  server.ext('onPreResponse', catchAll)

  return server
}
