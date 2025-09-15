/**
 * A GDS styled example home page controller.
 */

import { config } from '../../config/config.js'

export const homeController = {
  handler: (_request, h) => {
    const translations = _request.app.translations || {}
    const currentLang = _request.app.currentLang || 'en'

    return h.view('home/index', {
      pageTitle: 'Home',
      heading: translations['local-authority'] || 'local-authority',
      currentLang,
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        }
      ]
    })
  }
}
