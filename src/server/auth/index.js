import { authorizeOidcController } from './authorize-oidc.js'
import { signOutController } from './sign-out.js'

export const auth = {
  plugin: {
    name: 'auth_routes',
    register(server) {
      server.route([authorizeOidcController, signOutController])
    }
  }
}
