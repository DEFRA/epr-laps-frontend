import { defraAccountController } from './controller.js'

export const defraAccount = {
  plugin: {
    name: 'defraAccount',
    register(server) {
      server.route({
        method: 'GET',
        path: '/defra-account',
        ...defraAccountController
      })
    }
  }
}