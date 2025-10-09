/**
 * A GDS styled example get help controller
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { context } from '../../config/nunjucks/context/context.js'

export const getHelpController = {
  handler: async (_request, h) => {
    try {
      const viewContext = await context(_request)
      const { currentLang, translations } = viewContext

      return h.view('get-help/index.njk', {
        pageTitle: 'Get Help',
        currentLang,
        translations,
        breadcrumbs: [
          {
            text: translations['laps-home'],
            href: `/?lang=${currentLang}`
          },
          {
            text: translations['get-help'],
            href: `/get-help?lang=${currentLang}`
          }
        ]
      })
    } catch (error) {
      _request.logger.error('Error rendering home page:', error)

      if (error.message === 'Unauthorized') {
        return h
          .response({ error: 'Unauthorized' })
          .code(statusCodes.unauthorized)
      }

      return h
        .response({ error: 'Failed to render home page' })
        .code(statusCodes.internalServerError)
    }
  }
}
