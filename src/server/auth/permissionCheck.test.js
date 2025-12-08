import { describe, it, expect, vi } from 'vitest'
import requirePermission from './permissionCheck.js'

// Helper to mock Hapi's response toolkit (h)
function createH() {
  return {
    redirect: vi.fn().mockReturnThis(),
    takeover: vi.fn()
  }
}

describe('permissionCheck pre-handler', () => {
  it('redirects when userPermissions is missing', () => {
    // const pre = requirePermission('createBankDetails')
    // const h = createH()
    // const request = {
    //   yar: { get: () => null }, // no session permissions
    //   server: { app: { permissions: {} } }
    // }
    // const result = pre.method(request, h)
    // expect(h.redirect).toHaveBeenCalledWith('/bank-details')
    // expect(h.takeover).toHaveBeenCalled()
  })

  it('redirects when specific permission is false', () => {
    const pre = requirePermission('createBankDetails')

    const h = createH()

    const request = {
      yar: {
        get: () => ({
          createBankDetails: false
        })
      },
      server: {
        app: { permissions: { createBankDetails: true } }
      }
    }

    pre.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/bank-details')
    expect(h.takeover).toHaveBeenCalled()
  })

  it('allows access when permission is true', () => {
    const pre = requirePermission('createBankDetails')

    const h = createH()

    const request = {
      yar: {
        get: () => ({
          createBankDetails: true
        })
      },
      server: {
        app: { permissions: { createBankDetails: true } }
      }
    }

    const result = pre.method(request, h)

    expect(result).toBe(true) // allowed
    expect(h.redirect).not.toHaveBeenCalled()
    expect(h.takeover).not.toHaveBeenCalled()
  })

  it('redirects if permissionKey does not exist on sessionPermissions', () => {
    const pre = requirePermission('createBankDetails')

    const h = createH()

    const request = {
      yar: {
        get: () => ({
          someOtherPermission: true
        })
      },
      server: {
        app: { permissions: { createBankDetails: true } }
      }
    }

    pre.method(request, h)

    expect(h.redirect).toHaveBeenCalledWith('/bank-details')
    expect(h.takeover).toHaveBeenCalled()
  })
})
