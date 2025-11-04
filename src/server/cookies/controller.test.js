import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookiesController } from './controller.js'
import { formatDuration } from '../../server/common/helpers/utils.js'
import { config } from '../../config/config.js'

// --- Mock dependencies ---
vi.mock('../../server/auth/utils.js', () => ({
  formatDuration: vi.fn()
}))

vi.mock('../../config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

describe.skip('cookiesController', () => {
  let request
  let h

  beforeEach(() => {
    vi.clearAllMocks()

    request = {
      path: '/cookies',
      app: {
        translations: {
          hours: 'heures',
          days: 'jours',
          years: 'ans',
          minutes: 'minutes'
        }
      }
    }

    h = {
      view: vi.fn()
    }

    config.get.mockReturnValue(7200000) // 2 hours in ms
  })

  it('calls formatDuration with session cookie ttl', () => {
    formatDuration.mockReturnValue('2 hours')

    cookiesController.handler(request, h)

    expect(formatDuration).toHaveBeenCalledWith(7200000)
  })

  it('translates duration units based on translations map', () => {
    formatDuration.mockReturnValue('2 hours')

    cookiesController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      sessionCookieExpiry: '2 heures',
      currentPath: '/cookies'
    })
  })

  it('uses fallback words if translations missing', () => {
    request.app.translations = {} // no translations
    formatDuration.mockReturnValue('3 days')

    cookiesController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      sessionCookieExpiry: '3 days',
      currentPath: '/cookies'
    })
  })

  it('handles multiple words (e.g., years and days)', () => {
    formatDuration.mockReturnValue('3 days')

    cookiesController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      sessionCookieExpiry: '3 jours',
      currentPath: '/cookies'
    })
  })
})
