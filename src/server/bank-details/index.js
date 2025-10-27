import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsInfoController,
  updateBankDetailsController
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
        handler: (request, h) => {
          const translations = request.app.translations || {}
          const currentLang = request.app.currentLang || 'en'
          return h.view('bank-details/bank-details-confirmed.njk', {
            pageTitle: 'Bank Details Confirmed',
            currentLang,
            translations
          })
        }
      })
    }
  }
}
