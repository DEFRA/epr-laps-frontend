import { noServiceRoleController } from './controller.js'

export const noServiceRole = {
  plugin: {
    name: 'noServiceRole',
    register(server) {
      server.route({
        method: 'GET',
        path: '/no-service-role',
        ...noServiceRoleController
      })
    }
  }
}
