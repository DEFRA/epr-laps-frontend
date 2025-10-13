import { describe, it, expect, vi } from 'vitest'
import { noServiceRoleController } from './controller.js'

describe('noServiceRoleController', () => {
  it('should render the no service role view with correct context', () => {
    const h = {
      view: vi.fn().mockReturnValue({ code: vi.fn() })
    }

    noServiceRoleController.handler({}, h)

    expect(h.view).toHaveBeenCalledWith(
      'no-service-role/index.njk',
      expect.objectContaining({
        pageTitle: 'No Service Role'
      })
    )
  })
})
