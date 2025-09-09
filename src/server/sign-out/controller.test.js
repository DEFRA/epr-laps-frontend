import { createServer } from '../server.js'
import { statusCodes } from '../common/constants/status-codes.js'

describe('#signOutController', () => {
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  test('GET /sign-out should render the sign out page', async () => {
    const { result, statusCode } = await server.inject({
      method: 'GET',
      url: '/sign-out'
    })

    expect(statusCode).toBe(statusCodes.ok)
    expect(result).toContain('<title>  Sign out |')
  })
})
