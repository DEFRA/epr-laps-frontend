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
