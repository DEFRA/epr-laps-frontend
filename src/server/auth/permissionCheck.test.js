import { describe, it, expect } from 'vitest'
import Boom from '@hapi/boom'
import requirePermission from './permissionCheck.js'

describe('permissionCheck pre-handler', () => {
  it('throws Boom.notFound when userPermissions is missing', () => {
    const pre = requirePermission('createBankDetails')

    const request = {
      yar: { get: () => null }
    }

    expect(() => pre.method(request, {})).toThrowError(
      Boom.notFound().constructor
    )
  })

  it('throws Boom.notFound when specific permission is false', () => {
    const pre = requirePermission('createBankDetails')

    const request = {
      yar: {
        get: () => ({
          createBankDetails: false
        })
      }
    }

    expect(() => pre.method(request, {})).toThrowError(
      Boom.notFound().constructor
    )
  })

  it('allows access when permission is true', () => {
    const pre = requirePermission('createBankDetails')

    const request = {
      yar: {
        get: () => ({
          createBankDetails: true
        })
      }
    }

    const result = pre.method(request, {})

    expect(result).toBe(true)
  })

  it('throws Boom.notFound if permissionKey does not exist on sessionPermissions', () => {
    const pre = requirePermission('createBankDetails')

    const request = {
      yar: {
        get: () => ({
          someOtherPermission: true
        })
      }
    }

    expect(() => pre.method(request, {})).toThrowError(
      Boom.notFound().constructor
    )
  })
})
