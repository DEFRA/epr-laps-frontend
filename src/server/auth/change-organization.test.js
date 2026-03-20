import { changeOrganizationController } from './change-organization.js'

describe('#change-organisation', () => {
  it('should redirect to the home page and set the referrer flash message', async () => {
    const request = {
      yar: {
        flash: vi.fn()
      }
    }
    const h = {
      redirect: vi.fn().mockReturnThis()
    }

    await changeOrganizationController.handler(request, h)

    expect(request.yar.flash).toHaveBeenCalledWith('referrer', '/')
    expect(h.redirect).toHaveBeenCalledWith('/')
  })
})
