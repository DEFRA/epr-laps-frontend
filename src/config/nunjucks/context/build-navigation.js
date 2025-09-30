import { config } from '../../config.js'
const ONE_ORGANIZATION = 1

export async function buildNavigation(request) {
  const translations = request?.app?.translations || {}
  const currentLang = request.query?.lang || 'en'
  const defraAccountUrl = config.get('defraId.manageAccountUrl')
  const userSession = await request.getUserSession(
    request,
    request.state?.userSession
  )

  // If on sign-out page, return empty navigation
  if (request.path === '/sign-out') {
    return []
  }

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
      href: `/sign-out?lang=${currentLang}`,
      current: request?.path === '/sign-out'
    }
  ]
}
