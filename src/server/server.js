import path from 'path'
import hapi from '@hapi/hapi'
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
import bell from '@hapi/bell'
import cookie from '@hapi/cookie'
import { defraId } from './common/helpers/auth/defra-id.js'
import { getUserSession } from './common/helpers/auth/utils.js'
import { hapiI18n } from './common/helpers/hapi-i18n.js'

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

  server.ext('onRequest', handleTranslations)

  server.app.cache = server.cache({
    cache: 'session',
    expiresIn: config.get('redis.ttl'),
    segment: 'session'
  })

  server.decorate('request', 'getUserSession', getUserSession)

  await server.register([
    requestLogger,
    requestTracing,
    secureContext,
    pulse,
    sessionCache,
    bell,
    cookie,
    defraId,
    nunjucksConfig,
    router,
    hapiI18n
  ])

  server.ext('onPreResponse', catchAll)

  return server
}

function handleTranslations(request, h) {
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
}
