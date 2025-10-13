export const noServiceRole = {
  type: 'onPreHandler',
  method: (request, h) => {
    console.log('Request path:', request.path)
    console.log('Is Authenticated:', request.auth?.isAuthenticated)
    console.log('Roles:', request.auth?.credentials?.roles)

    // Skip paths that should never trigger this check
    const publicPaths = [
      '/login',
      '/logout',
      '/sign-out',
      '/no-service-role',
      '/auth-response',
      '/public',
      '/assets'
    ]

    if (publicPaths.some((path) => request.path.startsWith(path))) {
      return h.continue
    }

    // If user is authenticated, check for roles
    if (request.auth?.isAuthenticated) {
      const roles = request.auth.credentials?.roles || []

      if (roles.length === 0) {
        console.log(
          'User has no service role – redirecting to /no-service-role'
        )
        return h.redirect('/no-service-role').takeover()
      }
    }

    return h.continue
  }
}
