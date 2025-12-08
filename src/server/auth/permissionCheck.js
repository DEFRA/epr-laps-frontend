export default function requirePermission(permissionKey) {
  return {
    assign: 'permission',
    method: (request, h) => {
      const sessionPermissions = request.yar.get('userPermissions')

      // Safety check
      if (!sessionPermissions) {
        return h.redirect('/bank-details').takeover()
      }

      const allowed = sessionPermissions[permissionKey]

      // If the permission is not true → redirect
      if (!allowed) {
        return h.redirect('/bank-details').takeover()
      }

      // otherwise allow route to continue
      return true
    }
  }
}
