import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#bankDetailsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()

    server.ext('onRequest', (request, h) => {
      request.app.translations = {
        'bank-details': 'Bank details',
        'the-nominated-h': 'Notification heading',
        'your-local': 'Your local info',
        'laps-home': 'Local Authority Payments (LAPs) home'
      }
      request.app.currentLang = 'en'
      return h.continue
    })

    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should render breadcrumbs in the bank details page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    expect(statusCode).toBe(statusCodes.ok)

    expect(result).toContain('Local Authority Payments (LAPs) home')
    expect(result).toContain('Bank details')
  })
})
