import { getHelpController } from './controller.js'

export const getHelp = {
  plugin: {
    name: 'getHelp',
    register(server) {
      server.route({
        method: 'GET',
        path: '/get-help',
        ...getHelpController
      })
    }
  }
}
