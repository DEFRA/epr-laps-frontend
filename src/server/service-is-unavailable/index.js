import { serviceUnavailableController } from './controller.js'

export const serviceUnavailable = {
  plugin: {
    name: 'serviceUnavailable',
    register(server) {
      server.route({
        method: 'GET',
        path: '/service-unavailable',
        ...serviceUnavailableController
      })
    }
  }
}
