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
        },
        {
          method: 'POST',
          path: '/cookies/hide',
          options: {
            auth: false
          },
          handler: (request, h) => {
            return h
              .redirect(request.info.referrer || '/')
              .state('hideBanner', 'true')
          }
        }
      ])
    }
  }
}
