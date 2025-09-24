import { config } from '../../config.js'

export function buildNavigation(request) {
  const translations = request?.app?.translations || {}
  const defraAccountUrl = config.get('defraId.manageAccountUrl')

  return [
    {
      text: translations['your-defra-acco'],
      href: defraAccountUrl,
      current: false
    },
    {
      text: translations['sign-out'],
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
