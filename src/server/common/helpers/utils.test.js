import { mapPermissions, formatDuration } from './utils.js'

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
describe('formatDuration', () => {
  it('returns seconds when duration is less than a minute', () => {
    const result = formatDuration(5000) // 5 seconds
    expect(result).toBe('5 seconds')
  })

  it('returns 1 second (singular) when duration is exactly 1 second', () => {
    const result = formatDuration(1000)
    expect(result).toBe('1 second')
  })

  it('returns minutes when duration is between 1 minute and 1 hour', () => {
    const result = formatDuration(120000) // 2 minutes
    expect(result).toBe('2 minutes')
  })

  it('returns 1 minute (singular) when duration is 1 minute', () => {
    const result = formatDuration(60000)
    expect(result).toBe('1 minute')
  })

  it('returns hours when duration is between 1 hour and 1 day', () => {
    const result = formatDuration(4 * 60 * 60 * 1000) // 4 hours
    expect(result).toBe('4 hours')
  })

  it('returns 1 hour (singular) when duration is 1 hour', () => {
    const result = formatDuration(60 * 60 * 1000)
    expect(result).toBe('1 hour')
  })

  it('returns days when duration is between 1 day and 1 year', () => {
    const result = formatDuration(3 * 24 * 60 * 60 * 1000) // 3 days
    expect(result).toBe('3 days')
  })

  it('returns 1 day (singular) when duration is 1 day', () => {
    const result = formatDuration(24 * 60 * 60 * 1000)
    expect(result).toBe('1 day')
  })

  it('returns years when duration is more than a year', () => {
    const result = formatDuration(2 * 365 * 24 * 60 * 60 * 1000) // ~2 years
    expect(result).toBe('2 years')
  })

  it('returns 1 year (singular) when duration is approximately 1 year', () => {
    const result = formatDuration(365 * 24 * 60 * 60 * 1000)
    expect(result).toBe('1 year')
  })
})
