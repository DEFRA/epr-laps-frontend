/**
 * A GDS styled example get help controller
 */

import { config } from '../../config/config.js'

export const getHelpController = {
  handler: (request, h) => {
    const { currentLang, translations } = request.app
    const link = config.get('externalLink')

    return h.view('get-help/index.njk', {
      pageTitle: 'Get Help',
      currentLang,
      translations,
      externalLink: link,
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
  }
}
