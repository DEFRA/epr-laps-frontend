import {
  getUserSession,
  removeUserSession,
  refreshAccessToken,
  updateUserSession
} from './utils.js'
import { isPast, parseISO, subMinutes } from 'date-fns'

export const validateUserSession = async (request, session) => {
  const authedUser = await getUserSession(request, session)
  if (!authedUser) {
    return { isValid: false }
  }

  const tokenHasExpired = isPast(subMinutes(parseISO(authedUser.expiresAt), 1))

  // Force refresh if from your-defra account OR if token has expired
  if (tokenHasExpired) {
    request.yar.reset()
    const response = await refreshAccessToken(request, session)

    if (!response.ok) {
      removeUserSession(request, session)
      return { isValid: false }
    }

    const refreshAccessTokenJson = response.json
    const updatedSession = await updateUserSession(
      request,
      refreshAccessTokenJson
    )

    return {
      isValid: true,
      credentials: updatedSession
    }
  }
  const userSession = await request.server.app.cache.get(session.sessionId)

  if (userSession) {
    return {
      isValid: true,
      credentials: userSession
    }
  }

  return { isValid: false }
}
