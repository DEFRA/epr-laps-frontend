/**
 * A GDS styled example get help controller
 */

import { config } from '../../config/config.js'

export const getHelpController = {
  handler: (request, h) => {
    const { currentLang, translations } = request.app
    const link = config.get('getHelpUrl')
    const customerEmail = config.get('customerServiceEmail')

    return h.view('get-help/index.njk', {
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
          text: translations['get-help'],
          href: `/get-help?lang=${currentLang}`
        }
      ]
    })
  }
}
