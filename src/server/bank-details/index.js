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
          // const lastError = request.yar?.get('lastError')

          // console.log('Last error from yar:', lastError)
          // ✅ If this is a service problem, short-circuit and re-render error page
          // if (lastError?.kind === 'service-problem') {
          //   const translations = request.app?.translations || {}

          //   const { heading, message } = statusCodeMessage(
          //     lastError.statusCode,
          //     translations
          //   )

          //   return h
          //     .view('error/index', {
          //       pageTitle: heading,
          //       heading,
          //       message
          //     })
          //     .code(lastError.statusCode)
          // } else {
          //   console.log('in else')
          //   request.yar?.clear('lastError')
          // }

          const lastError = request.state.lastError

          console.log('Last error from cookie:', lastError)

          // ✅ Service problem → short-circuit controller
          if (lastError?.kind === 'service-problem') {
            const translations = request.app?.translations || {}

            // const { heading, message } = statusCodeMessage(
            //   lastError.statusCode,
            //   translations
            // )
            const heading = translations['service-problem']
            const message = translations['try-again']

            // ✅ clear after use
            h.unstate('lastError')

            return h
              .view('error/index', {
                pageTitle: heading,
                heading,
                message
              })
              .code(lastError.statusCode)
          }

          // ✅ clear stale error state
          if (lastError) {
            h.unstate('lastError', { path: '/' })
          }

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
