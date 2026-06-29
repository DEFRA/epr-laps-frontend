import { accessibilityController } from './controller.js'

export const accessibilityStatement = {
  plugin: {
    name: 'accessibilityStatement',
    register(server) {
      server.route({
        method: 'GET',
        path: '/accessibility-statement',
        ...accessibilityController
      })
    }
  }
}
