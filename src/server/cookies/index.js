import { cookiesController } from './controller.js'
import { setCookiePreference } from '../../server/common/helpers/cookies.js'
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
            const response = h.redirect(request.info.referrer || '/')
            return setCookiePreference(response)
          }
        }
      ])
    }
  }
}
