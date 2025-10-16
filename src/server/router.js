import inert from '@hapi/inert'

import { home } from './home/index.js'
import { health } from './health/index.js'
import { serveStaticFiles } from './common/helpers/serve-static-files.js'
import { paymentDocuments } from './payment-documents/index.js'
import { bankDetails } from './bank-details/index.js'
import { getHelp } from './get-help/index.js'
import { signOut } from './sign-out/index.js'
import { defraAccount } from './defra-account/index.js'
import { auth } from './auth/index.js'
import { noServiceRole } from './no-service-role/index.js'
import Boom from '@hapi/boom'

export const router = {
  plugin: {
    name: 'router',
    async register(server) {
      await server.register([inert])

      // Health-check route. Used by platform to check if service is running, do not remove!
      await server.register([health])

      // Application specific routes, add your own routes here
      await server.register([
        home,
        paymentDocuments,
        bankDetails,
        getHelp,
        signOut,
        auth,
        defraAccount,
        noServiceRole
      ])

      // Static assets
      await server.register([serveStaticFiles])

      //Global catch-all route for unknown URLs (404)
      server.route({
        method: '*',
        path: '/{any*}',
        handler: (_request, _h) => Boom.notFound()
      })
    }
  }
}
