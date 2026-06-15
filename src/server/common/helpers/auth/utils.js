import { getOpenIdRefreshToken } from './get-oidc-config.js'
import jwt from '@hapi/jwt'
import { addSeconds } from 'date-fns'
import { config } from '../../../../config/config.js'

export const getUserSession = async (request, session) => {
  if (session?.sessionId) {
    const userSession = await request.server.app.cache.get(session.sessionId)
    return userSession
  }

  return null
}

export const removeUserSession = (request, session) => {
  request.server.app.cache.drop(session.sessionId)
  request.yar.reset()
  request.cookieAuth.clear()
}

export const refreshAccessToken = async (request) => {
  const authedUser = await getUserSession(request, request.state.userSession)
  request.logger.setBindings({ refreshingAccessToken: authedUser.strategy })

  const authConfig = config.get('defraId')
  const { clientId, clientSecret, scopes, redirectUrl } = authConfig

  const refreshToken = authedUser?.refreshToken ?? null
  const redirectUri = `${redirectUrl}${'/auth-response'}`

  const params = {
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    scope: scopes,
    redirect_uri: redirectUri
  }

  return getOpenIdRefreshToken(authedUser.tokenUrl, params)
}

export const updateUserSession = async (request, refreshedSession) => {
  const payload = jwt.token.decode(refreshedSession.access_token).decoded
    .payload

  const expiresInSeconds = refreshedSession.expires_in
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  const authedUser = await getUserSession(request, request.state.userSession)
  const displayName = [payload.firstName, payload.lastName]
    .filter(Boolean)
    .join(' ')

  await request.server.app.cache.set(
    request.state.userSession.sessionId,
    {
      ...authedUser,
      id: payload.sub,
      correlationId: payload.correlationId,
      contactId: payload.contactId,
      serviceId: payload.serviceId,
      firstName: payload.firstName,
      lastName: payload.lastName,
      displayName,
      email: payload.email,
      uniqueReference: payload.uniqueReference,
      loa: payload.loa,
      aal: payload.aal,
      enrolmentCount: payload.enrolmentCount,
      enrolmentRequestCount: payload.enrolmentRequestCount,
      currentRelationshipId: payload.currentRelationshipId,
      relationships: payload.relationships,
      roles: payload.roles,
      isAuthenticated: true,
      idToken: refreshedSession.id_token,
      token: refreshedSession.access_token,
      refreshToken: refreshedSession.refresh_token,
      expiresIn: expiresInMilliSeconds,
      expiresAt: expiresAt.toISOString()
    },
    expiresInMilliSeconds
  )

  return getUserSession(request, request.state.userSession)
}
