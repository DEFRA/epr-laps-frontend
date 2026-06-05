/**
 * A GDS styled example get help controller
 */

import { config } from '../../config/config.js'

export const accessibilityController = {
  handler: (request, h) => {
    const { currentLang, translations } = request.app
    const link = config.get('getHelpUrl')
    const customerEmail = config.get('customerServiceEmail')

    return h.view('accessibility-statement/index.njk', {
      pageTitle: 'Get Help',
      currentLang,
      translations,
      getHelpUrl: link,
      customerServiceEmail: customerEmail,
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
