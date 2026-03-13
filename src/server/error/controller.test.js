import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serviceProblemController } from './controller.js'

describe('serviceProblemController', () => {
  let request, h

  beforeEach(() => {
    h = {
      view: vi.fn().mockReturnValue('view-rendered')
    }

    request = {
      app: {
        translations: {
          'service-problem': 'There is a problem with the service',
          'try-again': 'Please try again later'
        }
      }
    }
  })

  it('renders error page with translations from request.app', () => {
    const result = serviceProblemController.handler(request, h)

    expect(result).toBe('view-rendered')
    expect(h.view).toHaveBeenCalledWith('error/index', {
      pageTitle: 'There is a problem with the service',
      heading: 'There is a problem with the service',
      message: 'Please try again later'
    })
  })

  it('handles missing translations gracefully', () => {
    request.app.translations = {}

    const result = serviceProblemController.handler(request, h)

    expect(result).toBe('view-rendered')
    expect(h.view).toHaveBeenCalledWith('error/index', {
      pageTitle: undefined,
      heading: undefined,
      message: undefined
    })
  })

  it('handles missing request.app gracefully', () => {
    request.app = undefined

    const result = serviceProblemController.handler(request, h)

    expect(result).toBe('view-rendered')
    expect(h.view).toHaveBeenCalledWith('error/index', {
      pageTitle: undefined,
      heading: undefined,
      message: undefined
    })
  })
})
