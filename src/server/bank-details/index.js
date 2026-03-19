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

      server.route({
        method: 'GET',
        path: '/bank-details/bank-details-confirmed',
        handler: (request, h) => {
          const lastError = request.state.lastError

          // Log for debugging
          request.logger.info(
            { lastError, allState: request.state },
            'GET /bank-details/bank-details-confirmed'
          )

          // If there was a service problem, show the error page
          if (lastError?.kind === 'service-problem') {
            const translations = request.app?.translations || {}
            const heading = translations['service-problem'] || 'Service Problem'
            const message =
              translations['try-again'] || 'Please try again later'

            // Return error view without clearing the cookie
            return h
              .view('error/index', {
                pageTitle: heading,
                heading,
                message
              })
              .code(lastError.statusCode || 500)
          }

          // Normal confirmed page — pass defaults to avoid template errors
          return h.view('bank-details/bank-details-confirmed.njk', {
            pageTitle: 'Bank Details Confirmed',
            bankDetails: request.state.bankDetails || {},
            user: request.auth?.credentials || {}
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
