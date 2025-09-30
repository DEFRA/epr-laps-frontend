import {
  bankDetailsController,
  confirmBankDetailsController
} from './controller.js'

export const bankDetails = {
  plugin: {
    name: 'bankDetails',
    register(server) {
      server.route({
        method: 'GET',
        path: '/bank-details',
        ...bankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/bank-details/confirm',
        ...confirmBankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/bank-details/bank-details-confirmed',
        ...confirmBankDetailsController
      })
    }
  }
}
