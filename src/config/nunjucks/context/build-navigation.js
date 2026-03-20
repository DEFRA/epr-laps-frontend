import { config } from '../../config.js'
const ONE_ORGANIZATION = 1

export async function buildNavigation(request) {
  const translations = request?.app?.translations || {}
  const currentLang = request?.app?.currentLang
  const defraAccountUrl = config.get('defraId.manageAccountUrl')
  const userSession = await request.getUserSession(
    request,
    request.state?.userSession
  )

  // If on sign-out or timed-out page, return empty navigation
  if (request.path === '/logout' || request.path === '/timed-out') {
    return []
  }

  return [
    {
      text: translations['your-defra-acco'],
      href: defraAccountUrl,
      current: false
    },
    ...(userInMultipleOrganisations(userSession)
      ? [
          {
            text: translations['change-orga'],
            href: '/change-organisation',
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

export function userInMultipleOrganisations(userSession) {
  if (userSession.relationships.length > ONE_ORGANIZATION) {
    return true
  }

  /**
   * if usersession.enrolmentCount is greater than userSession.roles
   * then the user is in multiple organisations, as they have more enrolments than roles
   */
  if (userSession.enrolmentCount > userSession.roles.length) {
    return true
  }

  /**
  * If enrolmentRequestCount is greater than the number of
    relationships that don’t have matching roles , then
    the user has enrolment requests on an unselected
    organisation and so should be offered the option to
    switch
  */
  if (
    userSession.enrolmentRequestCount >
    userSession.relationships.filter(
      (rel) => !userSession.roles.includes(rel.role)
    ).length
  ) {
    return true
  }

  return false
}
