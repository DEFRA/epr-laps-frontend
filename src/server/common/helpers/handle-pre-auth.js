import { handleSSORefresh } from './../../common/helpers/auth/utils.js'

export async function handlePreAuth(request, h) {
  // Log the session check
  request.logger.debug(
    `onPreAuth - checking for user session: ${request.yar.get('getUserSession')}`
  )

  // Retrieve the session
  const session = request.yar.get('getUserSession')

  // Handle SSO refresh if needed
  await handleSSORefresh(request, h, session)

  // Continue the request lifecycle
  return h.continue
}
