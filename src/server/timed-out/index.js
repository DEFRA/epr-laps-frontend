import { timedOutController } from './controller.js'

export const timedOut = {
  plugin: {
    name: 'timedOut',
    register(server) {
      server.route({
        method: 'GET',
        path: '/timed-out',
        options: {
          auth: false
        },
        ...timedOutController
      })
    }
  }
}
