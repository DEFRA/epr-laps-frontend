import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsInfoController,
  updateBankDetailsController,
  checkBankDetailsController,
  postBankDetailsController,
  bankDetailsSubmittedController
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
        path: '/update-bank-details-info',
        ...updateBankDetailsInfoController
      })
      server.route({
        method: 'GET',
        path: '/update-bank-details',
        ...updateBankDetailsController
      })
      server.route({
        method: 'POST',
        path: '/bank-details/bank-details-confirmed',
        ...bankDetailsConfirmedController
      })
      server.route({
        method: 'GET',
        path: '/bank-details/bank-details-confirmed',
        handler: (_request, h) => {
          return h.view('bank-details/bank-details-confirmed.njk', {
            pageTitle: 'Bank Details Confirmed'
          })
        }
      })
      server.route({
        method: 'GET',
        path: '/bank-details/check-bank-details',
        ...checkBankDetailsController
      })
      server.route({
        method: 'POST',
        path: '/bank-details',
        ...postBankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/bank-details/bank-details-submitted',
        ...bankDetailsSubmittedController
      })
    }
  }
}
