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
          method: 'GET',
          path: '/payment-documents',
          ...paymentDocumentsController
        },
        {
          method: 'GET',
          path: '/file/{fileId}',
          ...fileDownloadController
        }
      ])
    }
  }
}
