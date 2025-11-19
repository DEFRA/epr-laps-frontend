/**
 * A GDS styled example home page controller.
 */
import { fetchWithToken } from '../auth/utils.js'
import { mapPermissions } from '../common/helpers/utils.js'

export const homeController = {
  handler: async (request, h) => {
    let userPermissions = {}
    const { currentLang, translations } = request.app

    userPermissions = request.yar.get('userPermissions')
    if (!userPermissions) {
      request.logger.error('failed to load permission from cookie')
      const authorizationConfig = await fetchWithToken(
        request,
        '/permissions/config'
      )

      userPermissions = mapPermissions(
        authorizationConfig,
        request.auth.credentials?.currentRole
      )
      request.yar.set('userPermissions', userPermissions)
      request.logger.info(
        'permissions successfully fetched and saved in cookie'
      )
    }

    const bankPath = `/bank-details/${request.auth.credentials.organisationId}`
    const bankApiData = await fetchWithToken(request, bankPath)
    request.yar.set('bankDetails', bankApiData)
    request.logger.info('successfully fetched bank details')

    return h.view('home/index', {
      pageTitle: 'Home',
      breadcrumbs: [
        {
          text: translations['local-authority'],
          href: `/?lang=${currentLang}`
        }
      ],
      bankApiData,
      userPermissions
    })
  }
}
