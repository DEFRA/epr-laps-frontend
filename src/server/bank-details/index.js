import {
  bankDetailsController,
  confirmBankDetailsController,
  bankDetailsConfirmedController,
  updateBankDetailsInfoController,
  checkBankDetailsController,
  postBankDetailsController,
  postUpdateBankDetailsController,
  getUpdateBankDetailsController,
  bankDetailsSubmittedController,
  bankDetailsConfirmedErrorController,
  bankDetailsSubmittedErrorController
} from './controller.js'

export const bankDetails = {
  plugin: {
    name: 'bankDetails',
    register(server) {
      registerGetRoutes(server)
      registerPostRoutes(server)
      registerLanguageRoutes(server)
    }
  }
}

const registerGetRoutes = (server) => {
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
    method: 'GET',
    path: '/update-bank-details',
    ...getUpdateBankDetailsController
  })

  server.route({
    method: 'GET',
    path: '/bank-details-confirmed',
    handler: (_request, h) =>
      h.view('bank-details/bank-details-confirmed.njk', {
        pageTitle: 'Bank Details Confirmed'
      })
  })

  server.route({
    method: 'GET',
    path: '/bank-details/bank-details-confirmed',
    ...bankDetailsConfirmedErrorController
  })

  server.route({
    method: 'GET',
    path: '/check-bank-details',
    ...checkBankDetailsController
  })

  server.route({
    method: 'GET',
    path: '/bank-details-submitted',
    ...bankDetailsSubmittedController
  })

  server.route({
    method: 'GET',
    path: '/bank-details/bank-details-submitted',
    ...bankDetailsSubmittedErrorController
  })
}

const registerPostRoutes = (server) => {
  server.route({
    method: 'POST',
    path: '/bank-details/bank-details-confirmed',
    ...bankDetailsConfirmedController
  })

  server.route({
    method: 'POST',
    path: '/update-bank-details',
    ...postUpdateBankDetailsController
  })

  server.route({
    method: 'POST',
    path: '/bank-details',
    ...postBankDetailsController
  })
}

const registerLanguageRoutes = (server) => {
  server.route({
    method: 'POST',
    path: '/switch-language',
    handler: (req, h) => {
      // Save current form values before language switch
      req.yar.set('payload', {
        accountName: req.payload.accountName || '',
        sortCode: req.payload.sortCode || '',
        accountNumber: req.payload.accountNumber || ''
      })

      // Flag that indicates language toggle was used
      req.yar.set('languageSwitched', true)

      const newLang = req.payload.currentLang === 'en' ? 'cy' : 'en'
      return h.redirect(`/update-bank-details?lang=${newLang}`)
    }
  })
}
