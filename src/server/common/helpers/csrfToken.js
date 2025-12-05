import crumb from '@hapi/crumb'
import { config } from '../../../config/config.js'

export const csrf = {
  plugin: crumb,
  options: {
    key: 'csrfToken',
    cookieOptions: {
      isSecure: config.get('session.cookie.secure'),
      password: config.get('session.cookie.password'),
      ttl: config.get('session.cookie.ttl')
    },
    skip: (request) => {
      return request.method === 'GET' || request.path === '/health'
    }
  }
}
