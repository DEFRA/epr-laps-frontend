import { handlePreAuth } from './handle-pre-auth.js'
import { vi } from 'vitest'

vi.mock('./utils.js', () => ({
  handleSSORefresh: vi.fn()
}))

describe('handlePreAuth', () => {
  let mockRequest, mockH

  beforeEach(() => {
    mockRequest = {
      logger: {
        debug: vi.fn()
      },
      yar: {
        get: vi.fn().mockReturnValue('mock-session')
      }
    }
    mockH = { continue: Symbol('continue') }
  })

  test('should log session and call handleSSORefresh', async () => {
    const result = await handlePreAuth(mockRequest, mockH)

    expect(mockRequest.logger.debug).toHaveBeenCalledWith(
      'onPreAuth - checking for user session: mock-session'
    )
    expect(result).toBe(mockH.continue)
  })
})
