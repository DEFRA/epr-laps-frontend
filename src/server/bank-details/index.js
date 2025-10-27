import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsController,
  newBankDetailsConfirmedController,
  postBankDetailsController
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
      server.route({
        method: 'GET',
        path: '/bank-details/check-bank-details',
        ...newBankDetailsConfirmedController
      })
      server.route({
        method: 'POST',
        path: '/bank-details',
        ...postBankDetailsController
      })
      server.route({
        method: 'GET',
        path: '/bank-details/bank-details-submitted',
        handler: (request, h) => {
          const translations = request.app.translations || {}
          const currentLang = request.app.currentLang || 'en'
          return h.view('bank-details/bank-details-created.njk', {
            pageTitle: 'Bank Details Created',
            currentLang,
            translations
          })
        }
      })
    }
  }
}
