import { cookiesController } from './controller.js'

export const cookies = {
  plugin: {
    name: 'cookies',
    register(server) {
      server.route([
        {
          method: 'GET',
          path: '/cookies',
          options: {
            auth: false
          },
          ...cookiesController
        }
      ])
    }
  }
}
