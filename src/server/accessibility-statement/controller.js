/**
 * A GDS styled example accessibility statement controller
 */

import { config } from '../../config/config.js'

export const accessibilityController = {
  handler: (request, h) => {
    const { currentLang, translations } = request.app
    const link = config.get('getHelpUrl')
    return h.view('accessibility-statement/index.njk', {
      pageTitle: 'Accessibility Statement',
      currentLang,
      translations,
      getHelpUrl: link,
      breadcrumbs: [
        {
          text: translations['laps-home'],
          href: `/?lang=${currentLang}`
        },
        {
          text: translations['accessibility-statement'],
          href: `/accessibility-statement?lang=${currentLang}`
        }
      ]
    })
  }
}
