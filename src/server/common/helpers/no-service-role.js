export function handlePostAuth(request, h) {
  // Skip paths that should never trigger this check
  const publicPaths = [
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
      return h.redirect('/no-service-role').takeover()
    }
  }

  return h.continue
}
