import {
  paymentDocumentsController,
  fileDownloadController
} from './controller.js'

export const paymentDocuments = {
  plugin: {
    name: 'paymentDocuments',
    register(server) {
      server.route([
        {
          method: ['GET', 'POST'],
          path: '/payment-documents',
          ...paymentDocumentsController
        },
        {
          method: 'GET',
          path: '/document/{fileId}',
          ...fileDownloadController
        },
        {
          method: 'GET',
          path: '/session/js-enabled',
          handler: (request, h) => {
            request.yar.set('js_enabled', true)
            return h.response().code(204)
          }
        },
        {
          method: 'GET',
          path: '/document/view/{fileId}',
          options: {
            pre: [
              (request, h) => {
                request.query.view = 'true'
                return h.continue
              }
            ]
          },
          ...fileDownloadController
        }
      ])
    }
  }
}
