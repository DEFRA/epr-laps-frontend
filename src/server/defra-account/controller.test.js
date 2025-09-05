import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#defraAccountController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('Should render defra-account page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/defra-account'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('<!DOCTYPE html>')
  })
})
