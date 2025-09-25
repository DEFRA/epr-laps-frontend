import { addSeconds } from 'date-fns'
import { context } from './../../config/nunjucks/context/context.js'
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
export const getToken = async (request) => {
  const ctx = await context(request)
  const token = ctx.authedUser?.token
  if (!token) {
    throw new Error('Unauthorized')
  }
  return { token, localAuthority: ctx.organisationName }
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
