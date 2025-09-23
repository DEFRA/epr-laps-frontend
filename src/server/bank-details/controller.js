/**
 * A GDS styled example bank details controller
 */
import { context } from './../../config/nunjucks/context/context.js'
import axios from 'axios'
import { config } from '../../config/config.js'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      // Build context from request (this gives you authedUser, navigation, etc.)
      const ctx = await context(request)

      // Token is stored in ctx.authedUser
      const token = ctx.authedUser?.token
      if (!token) {
        return h.response({ error: 'Unauthorized' }).code(401)
      }

      const bankDetailsAPIUrl = config.get('bankDetailAPIUrl')
      // Calling API
      const apiResponse = await axios.get(`${bankDetailsAPIUrl}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
        apiData: apiResponse.data
      })
    } catch (error) {
      return h.response({ error: 'Failed to fetch bank details' }).code(500)
    }
  }
}
