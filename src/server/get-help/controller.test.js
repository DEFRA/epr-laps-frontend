import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#getHelpController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should render breadcrumbs in the get help page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/get-help'
    })
  
    expect(statusCode).toBe(statusCodes.ok)
  
    // Since result is HTML, assert that it contains the breadcrumb text
    expect(result).toContain('Local Authority Payments (LAPs) home')
    expect(result).toContain('Get help')
  })
})
