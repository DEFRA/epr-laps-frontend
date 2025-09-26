import { addSeconds } from 'date-fns'
import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'

export const setUserSession = async (request) => {
  const { profile } = request.auth.credentials
  request.logger.debug(`Setting user session in cache: ${profile.sessionId}`)
  const expiresInSeconds = request.auth.credentials.expiresIn
  const expiresInMilliSeconds = expiresInSeconds * 1000
  const expiresAt = addSeconds(new Date(), expiresInSeconds)

  await request.server.app.cache.set(
    profile.sessionId,
    {
      ...profile,
      strategy: request.auth.strategy,
      isAuthenticated: request.auth.isAuthenticated,
      token: request.auth.credentials.token,
      refreshToken: request.auth.credentials.refreshToken,
      expiresIn: expiresInMilliSeconds,
      expiresAt: expiresAt.toISOString()
    },
    expiresInMilliSeconds
  )

  request.cookieAuth.set({ sessionId: profile.sessionId })
}

// To get token from request/context
export const getToken = (request) => {
  // get the token from the request auth credentials or cookie
  const token =
    request.auth?.credentials?.token || request.state?.userSession?.token
  if (!token) {
    throw new Error('Unauthorized')
  }
  return { token }
}

// To set headers for API call
export const setHeaders = (token) => {
  return {
    Authorization: `Bearer ${token}`
  }
}

// Make GET request
export const getRequest = async (url, headers) => {
  const { payload } = await Wreck.get(url, {
    headers,
    json: true
  })
  return payload
}

export const fetchWithToken = async (request, path) => {
  const { token } = getToken(request)

  const apiBaseUrl = config.get('backendApiUrl')
  const url = `${apiBaseUrl}${path}`

  const headers = setHeaders(token)

  return getRequest(url, headers)
}
