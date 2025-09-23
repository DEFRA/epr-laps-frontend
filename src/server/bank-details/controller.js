/**
 * A GDS styled example bank details controller
 */
import { context } from './../../config/nunjucks/context/context.js'
import { config } from '../../config/config.js'
import { statusCodes } from '../common/constants/status-codes.js'
import Wreck from '@hapi/wreck'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      // Build context from request (this gives you authedUser, navigation, etc.)
      const ctx = await context(request)

      // Token is stored in ctx.authedUser
      const token = ctx.authedUser?.token
      if (!token) {
        return h
          .response({ error: 'Unauthorized' })
          .code(statusCodes.unauthorized)
      }

      const bankDetailsAPIUrl = config.get('BACKEND_API')
      const localAuthority = ctx.localAuthority
      // Construct the URL
      const url = `${bankDetailsAPIUrl}/bank-details/${encodeURIComponent(localAuthority)}`

      // Calling API
      const { payload } = await Wreck.get(url, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        json: true
      })

      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'
      // Render the view static and API data
      return h.view('bank-details/index.njk', {
        pageTitle: 'Bank Details',
        heading: 'Glamshire County Council',
        currentLang,
        translations,
        breadcrumbs: [
          {
            text: translations['laps-home'],
            href: `/?lang=${currentLang}`
          },
          {
            text: translations['bank-details'],
            href: `/bank-details?lang=${currentLang}`
          }
        ],
        apiData: payload.data
      })
    } catch (error) {
      return h
        .response({ error: 'Failed to fetch bank details' })
        .code(statusCodes.internalServerError)
    }
  }
}
