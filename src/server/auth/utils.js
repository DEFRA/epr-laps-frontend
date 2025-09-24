import { addSeconds } from 'date-fns'
import Wreck from '@hapi/wreck'
import { config } from '../../config/config.js'
import { jwtDecode } from 'jwt-decode'

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
  if (!token) throw new Error('Unauthorized')
  return { token, localAuthority: request.auth?.credentials?.localAuthority }
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

export const fetchWithToken = async (request, pathTemplate) => {
  const { token, localAuthority } = await getToken(request)

  const apiBaseUrl = config.get('backendApiUrl')
  const url = `${apiBaseUrl}${pathTemplate.replace(':localAuthority', encodeURIComponent(localAuthority))}`

  const headers = setHeaders(token)

  return getRequest(url, headers)
}

export const getRoleFromToken = (request) => {
  try {
    const { token } = getToken(request)
    const decoded = jwtDecode(token)
    const roles = decoded?.roles || []
    if (!roles.length) return null
    const parts = roles[0].split(':')
    return parts.length >= 2 ? parts[1] : roles[0]
  } catch (err) {
    request?.logger?.error?.('Failed to extract role from token', err)
    return null
  }
}
