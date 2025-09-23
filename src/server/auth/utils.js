import { addSeconds } from 'date-fns'

export const setUserSession = async (request) => {
  const { profile } = request.auth.credentials
  console.log('User profile:', profile)
  request.logger.debug(`Setting user session in cache: ${profile.sessionId}`)
  const expiresInSeconds = request.auth.credentials.expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  // Extract organisation name dynamically
  let organisationName = null
  if (profile.relationships && profile.currentRelationshipId) {
    const match = profile.relationships.find((rel) =>
      rel.startsWith(profile.currentRelationshipId + ':')
    )
    if (match) {
      const parts = match.split(':')
      organisationName = parts[2]
    }
  }

  await request.server.app.cache.set(
    profile.sessionId,
    {
      ...profile,
      strategy: request.auth.strategy,
      isAuthenticated: request.auth.isAuthenticated,
      token: request.auth.credentials.token,
      refreshToken: request.auth.credentials.refreshToken,
      organisationName,
      expiresIn: expiresInMilliSeconds,
      expiresAt: expiresAt.toISOString()
    },
    expiresInMilliSeconds
  )

  request.cookieAuth.set({ sessionId: profile.sessionId })
}
