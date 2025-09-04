import { createServer } from '../server.js'
import { paymentDocumentsController } from './controller.js'

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
        translations: {}, // or whatever shape you expect
        currentLang: 'en'
      }
    }
    const mockH = {
      view: (template, context) => `<html>${template}</html>` // or your expected output
    }

    const response = paymentDocumentsController.handler(mockRequest, mockH)
    expect(typeof response).toBe('string')
  })
})
