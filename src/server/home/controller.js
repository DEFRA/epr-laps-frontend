/**
 * A GDS styled example home page controller.
 */
import { statusCodes } from '../common/constants/status-codes.js'
import { context } from '../../config/nunjucks/context/context.js'

export const homeController = {
  handler: async (request, h) => {
    try {
      const viewContext = await context(request)
      const { currentLang, translations } = viewContext

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
        ...viewContext
      })
    } catch (error) {
      request.logger.error('Error rendering home page:', error)

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
