const rolesMap = {
  'Chief Executive Officer': 'CEO',
  'Head of Finance': 'HOF',
  'Head of Waste': 'HOW',
  'Waste Officer': 'WO',
  'Finance Officer': 'FO'
}

export function mapPermissions(permissionConfig, userRole) {
  const mappedRole = rolesMap[userRole]
  const result = {}
  for (const action in permissionConfig) {
    if (Object.hasOwn(permissionConfig, action)) {
      result[action] = permissionConfig[action].includes(mappedRole)
    }
  }
  return result
}

export const formatDuration = (ms) => {
  const SECONDS_IN_MINUTE = 60
  const MINUTES_IN_HOUR = 60
  const HOURS_IN_DAY = 24
  const DAYS_IN_YEAR = 365 // avoid magic number

  const seconds = ms / 1000
  const minutes = seconds / SECONDS_IN_MINUTE
  const hours = minutes / MINUTES_IN_HOUR
  const days = hours / HOURS_IN_DAY
  const years = days / DAYS_IN_YEAR

  if (years >= 1) {
    return `${Math.round(years)} year${years >= 2 ? 's' : ''}`
  }
  if (days >= 1) {
    return `${Math.round(days)} day${days >= 2 ? 's' : ''}`
  }
  if (hours >= 1) {
    return `${Math.round(hours)} hour${hours >= 2 ? 's' : ''}`
  }
  if (minutes >= 1) {
    return `${Math.round(minutes)} minute${minutes >= 2 ? 's' : ''}`
  }
  return `${Math.round(seconds)} second${seconds >= 2 ? 's' : ''}`
}
