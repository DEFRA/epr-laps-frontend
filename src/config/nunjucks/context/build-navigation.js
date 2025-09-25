import { config } from '../../config.js'

export async function buildNavigation(request) {
  const translations = request?.app?.translations || {}
  const defraAccountUrl = config.get('defraId.manageAccountUrl')
  const userSession = await request.getUserSession(
    request,
    request.state?.userSession
  )
  return [
    {
      text: translations['your-defra-acco'],
      href: defraAccountUrl,
      current: false
    },
    ...(userSession.relationships.length > 1
      ? [
          {
            text: 'Change organisation',
            href: '/defra-account/change-organisation',
            current: false
          }
        ]
      : []),
    {
      text: translations['sign-out'],
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
