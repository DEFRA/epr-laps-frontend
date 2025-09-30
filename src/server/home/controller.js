/**
 * A GDS styled example home page controller.
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { fetchWithToken } from '../../server/auth/utils.js'

export const homeController = {
  handler: async (request, h) => {
    const translations = request.app.translations || {}
    const currentLang = request.app.currentLang || 'en'
    try {
      const roleName = request.auth.credentials.currentRole
      let payload = null
      if (roleName === 'Head of Finance') {
        const localAuthority = request.auth.credentials.organisationName
        // Fetch bank details via the wrapper function
        const path = `/bank-details/${encodeURIComponent(localAuthority)}`
        payload = await fetchWithToken(request, path)

        const sessionId = request.state.userSession.sessionId
        const existingSession =
          (await request.server.app.cache.get(sessionId)) || {}
        await request.server.app.cache.set(sessionId, {
          ...existingSession,
          apiData: payload
        })
        request.logger.info(
          `Successfully fetched bank details for ${localAuthority}`
        )
      }

      return h.view('home/index', {
        pageTitle: 'Home',
        currentLang,
        translations,
        breadcrumbs: [
          {
            text: translations['local-authority'],
            href: `/?lang=${currentLang}`
          }
        ],
        apiData: payload
      })
    } catch (error) {
      request.logger.error('Error fetching bank details:', error)

      // Handle unauthorized separately
      if (error.message === 'Unauthorized') {
        return h
          .response({ error: 'Unauthorized' })
          .code(statusCodes.unauthorized)
      }

      return h
        .response({ error: 'Failed to fetch bank details' })
        .code(statusCodes.internalServerError)
    }
  }
}
