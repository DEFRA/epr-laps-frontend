import { describe, it, expect, vi } from 'vitest'
import { cookiesController } from './controller.js'

describe('cookiesController', () => {
  it('should call h.view with the correct template and context', () => {
    // Arrange
    const h = {
      view: vi.fn().mockReturnValue('rendered-view')
    }

    // Act
    const result = cookiesController.handler({}, h)

    // Assert
    expect(h.view).toHaveBeenCalledTimes(1)
    expect(h.view).toHaveBeenCalledWith('cookies/index.njk', {})
    expect(result).toBe('rendered-view')
  })
})
