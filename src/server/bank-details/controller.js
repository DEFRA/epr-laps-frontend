/**
 * A GDS styled example bank details controller
 */
import { context } from './../../config/nunjucks/context/context.js'
import axios from 'axios'

export const bankDetailsController = {
  handler: async (request, h) => {
    try {
      // Build context from request (this gives you authedUser, navigation, etc.)
      const ctx = await context(request)

      // Token is stored in ctx.authedUser
      const token = ctx.authedUser?.token
      console.log('THE TOKEN', token)
      if (!token) {
        return h.response({ error: 'Unauthorized' }).code(401)
      }

      // Calling API
      const apiResponse = await axios.get(
        'http://localhost:3001/bank-details/sh',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )
      console.log('Bank details API response >>', apiResponse.data)

      const translations = request.app.translations || {}
      const currentLang = request.app.currentLang || 'en'
      // Render the view static and API data
      return h.view('bank-details/index.njk', {
        pageTitle: 'Bank Details',
        heading: 'Glamshire County Council',
        currentLang,
        isConfirmed: false,
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
      console.error('Error fetching bank details:', error)
      return h.response({ error: 'Failed to fetch bank details' }).code(500)
    }
  }
}
