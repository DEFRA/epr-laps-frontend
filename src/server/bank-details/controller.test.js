import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#bankDetailsController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
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
