import { config } from '../../config.js'
const ONE_ORGANIZATION = 1

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
    ...(userSession.relationships.length > ONE_ORGANIZATION
      ? [
          {
            text: translations['change-orga'],
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
