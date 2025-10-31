import { mapPermissions } from './utils'

describe('#mapPermissions', () => {
  const permissionConfig = {
    viewFullBankDetails: ['CEO'],
    updateBankDetails: ['HOF']
  }
  test('should return true when role is found in permission action', () => {
    const userPermission = mapPermissions(
      permissionConfig,
      'Chief Executive Officer'
    )
    expect(userPermission).toEqual({
      viewFullBankDetails: true,
      updateBankDetails: false
    })
  })
  test('should return appropriate permission when role is found', () => {
    const userPermission = mapPermissions(permissionConfig, 'Normal User')
    expect(userPermission).toEqual({
      viewFullBankDetails: false,
      updateBankDetails: false
    })
  })
})
