import { describe, it, expect, vi } from 'vitest'
import { cookiesController } from './controller.js'
import { config } from '../../config/config.js'
import { formatDuration } from '../../server/auth/utils.js'

vi.mock('../../config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('../../server/auth/utils.js', () => ({
  formatDuration: vi.fn()
}))

describe('cookiesController', () => {
  it('renders the cookies page with formatted expiry', () => {
    const mockRequest = {}
    const mockH = { view: vi.fn() }

    config.get.mockReturnValue(14400000)
    formatDuration.mockReturnValue('4 hours')
    mockH.view.mockReturnValue('Rendered view')

    const result = cookiesController.handler(mockRequest, mockH)

    expect(config.get).toHaveBeenCalledWith('session.cookie.ttl')
    expect(formatDuration).toHaveBeenCalledWith(14400000)
    expect(mockH.view).toHaveBeenCalledWith('cookies/index.njk', {
      sessionCookieExpiry: '4 hours'
    })
    expect(result).toBe('Rendered view')
  })
})
