import { createServer } from '../server.js'
import { paymentDocumentsController } from './controller.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#paymentDocumentsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should provide expected response', async () => {
    const mockRequest = {
      app: {
        translations: {},
        currentLang: 'en'
      }
    }
    const mockH = {
      view: (template, context) => `<html>${template}</html>`
    }

    const response = paymentDocumentsController.handler(mockRequest, mockH)
    expect(typeof response).toBe('string')
  })

  test('Should render breadcrumbs in the payment documents page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/payment-documents'
    })

    expect(statusCode).toBe(statusCodes.ok)

    // Since result is HTML, assert that it contains the breadcrumb text
    expect(result).toContain('Local Authority Payments (LAPs) home')
    expect(result).toContain('Payment documents')
  })
})
