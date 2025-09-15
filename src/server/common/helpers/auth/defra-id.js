import { getOidcConfig } from './get-oidc-config.js'
import { config } from '../../../../config/config.js'
import { openIdProvider } from './open-id.js'
import { validateUserSession } from './validate.js'

export const defraId = {
  plugin: {
    name: 'auth',
    register: async (server) => {
      const oidcConfig = await getOidcConfig()
      const defra = openIdProvider('defraId', oidcConfig)
      const { cookie } = config.get('session')
      const { clientId, clientSecret, serviceId, redirectUrl } =
        config.get('defraId')

      server.auth.strategy('defra-id', 'bell', {
        location: (request) => {
          request.yar.flash('referrer', '/')
          return `${redirectUrl}${'/auth-response'}`
        },
        provider: defra,
        password: cookie.password,
        clientId,
        clientSecret,
        isSecure: cookie.secure,
        providerParams: {
          serviceId
        }
      })

      server.auth.strategy('session', 'cookie', {
        cookie: {
          name: 'userSession',
          path: '/',
          password: cookie.password,
          isSecure: cookie.secure,
          ttl: cookie.ttl,
          isSameSite: 'Lax'
        },
        keepAlive: true,
        redirectTo: () => {
          return `/auth-response`
        },
        validate: async (request, session) => {
          const validity = await validateUserSession(request, session)
          return validity
        }
      })

      server.auth.default('session')
    }
  }
}
