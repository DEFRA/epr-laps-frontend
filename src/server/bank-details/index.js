import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsInfoController,
  checkBankDetailsController,
  postBankDetailsController,
  postUpdateBankDetailsController,
  getUpdateBankDetailsController,
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
        path: '/confirm',
        ...confirmBankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/update-bank-details-info',
        ...updateBankDetailsInfoController
      })
      server.route({
        method: 'POST',
        path: '/bank-details/bank-details-confirmed',
        ...bankDetailsConfirmedController
      })

      server.route({
        method: 'GET',
        path: '/update-bank-details',
        ...getUpdateBankDetailsController
      })
      server.route({
        method: 'POST',
        path: '/update-bank-details',
        ...postUpdateBankDetailsController
      })

      server.route({
        method: 'GET',
        path: '/bank-details-confirmed',
        handler: (_request, h) => {
          return h.view('bank-details/bank-details-confirmed.njk', {
            pageTitle: 'Bank Details Confirmed'
          })
        }
      })
      server.route({
        method: 'GET',
        path: '/check-bank-details',
        ...checkBankDetailsController
      })
      server.route({
        method: 'POST',
        path: '/bank-details',
        ...postBankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/bank-details-submitted',
        ...bankDetailsSubmittedController
      })
    }
  }
}
