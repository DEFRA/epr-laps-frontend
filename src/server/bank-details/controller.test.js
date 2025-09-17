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
        'your-local': "Your local authority's bank details",
        important: 'Important',
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

  test('Should have translations and currentLang available', async () => {
    const { result } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    // Check that a translated string and currentLang are rendered
    expect(result).toContain('Bank details')
    expect(result).toMatch(/Your local authority('|&#39;)s bank details/)
    expect(result).toContain('en')
  })

  test('Should fall back to defaults when translations and currentLang are missing', async () => {
    // Remove translations + lang injection for this test
    server.ext('onRequest', (request, h) => {
      request.app = {} // nothing set
      return h.continue
    })

    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/bank-details'
    })

    expect(statusCode).toBe(statusCodes.ok)

    expect(result).toContain('Bank Details')

    // fallback `currentLang = 'en'`
    expect(result).toContain('en')
  })
})
