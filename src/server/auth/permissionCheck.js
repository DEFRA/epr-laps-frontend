import Boom from '@hapi/boom'
export default function requirePermission(permissionKey) {
  return {
    assign: 'permission',
    method: (request, _h) => {
      const sessionPermissions = request.yar.get('userPermissions')

      if (!sessionPermissions) {
        throw Boom.notFound()
      }

      const allowed = sessionPermissions[permissionKey]

      if (!allowed) {
        throw Boom.notFound()
      }

      return true
    }
  }
}
