// service-problem/index.js
import { serviceProblemController } from './controller.js'

export const serviceProblem = {
  plugin: {
    name: 'serviceProblem',
    register: (server) => {
      server.route({
        method: 'GET',
        path: '/service-problem',
        ...serviceProblemController
      })
    }
  }
}
