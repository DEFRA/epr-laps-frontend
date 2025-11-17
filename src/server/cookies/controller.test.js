import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cookiesController } from './controller.js'
import { config } from '../../config/config.js'
import { formatDuration } from '../../server/common/helpers/utils.js'

vi.mock('../../config/config.js', () => ({
  config: { get: vi.fn() }
}))

vi.mock('../../server/common/helpers/utils.js', () => ({
  formatDuration: vi.fn()
}))

describe('cookiesController', () => {
  let h, request

  beforeEach(() => {
    h = {
      view: vi.fn().mockReturnValue('view-rendered')
    }

    request = {
      path: '/cookies',
      app: {
        translations: {
          hours: 'ore',
          days: 'giorni',
          years: 'anni',
          minutes: 'minuti'
        }
      }
    }

    vi.resetAllMocks()
  })

  it('renders with translated duration labels', () => {
    config.get.mockReturnValue(3600000)
    formatDuration.mockReturnValue('2 hours 5 minutes 3 days 1 years')

    const result = cookiesController.handler(request, h)

    expect(result).toBeUndefined()

    expect(config.get).toHaveBeenCalledWith('session.cookie.ttl')
    expect(formatDuration).toHaveBeenCalledWith(3600000)

    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      cookiePolicyExpiry: '2 hours 5 minutes 3 days 1 years',
      sessionCookieExpiry: '2 ore 5 minuti 3 giorni 1 anni',
      currentPath: '/cookies'
    })
  })

  it('falls back to English when translation missing', () => {
    request.app.translations = { hours: 'horas' }
    config.get.mockReturnValue(7200000)
    formatDuration.mockReturnValue('1 hours 10 minutes 2 days 5 years')

    const result = cookiesController.handler(request, h)

    expect(result).toBeUndefined()
    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      cookiePolicyExpiry: '1 hours 10 minutes 2 days 5 years',
      sessionCookieExpiry: '1 horas 10 minutes 2 days 5 years',
      currentPath: '/cookies'
    })
  })

  it('handles empty translation map gracefully', () => {
    request.app.translations = {}
    config.get.mockReturnValue(1000)
    formatDuration.mockReturnValue('10 minutes')

    const result = cookiesController.handler(request, h)

    expect(result).toBeUndefined()
    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      cookiePolicyExpiry: '10 minutes',
      sessionCookieExpiry: '10 minutes',
      currentPath: '/cookies'
    })
  })

  it('uses global regex to replace all occurrences', () => {
    request.app.translations = { minutes: 'minutos' }
    config.get.mockReturnValue(999)
    formatDuration.mockReturnValue('5 minutes and 10 minutes')

    const result = cookiesController.handler(request, h)

    expect(result).toBeUndefined()
    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {
      cookiePolicyExpiry: '5 minutes and 10 minutes',
      sessionCookieExpiry: '5 minutos and 10 minutos',
      currentPath: '/cookies'
    })
  })
})
