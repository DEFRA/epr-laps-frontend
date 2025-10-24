import path from 'node:path'
import { readFileSync } from 'node:fs'

import { config } from '../../config.js'
import { buildNavigation } from './build-navigation.js'
import { createLogger } from '../../../server/common/helpers/logging/logger.js'
import { fetchWithToken } from '../../../server/auth/utils.js'

const logger = createLogger()
const assetPath = config.get('assetPath')
const manifestPath = path.join(
  config.get('root'),
  '.public/assets-manifest.json'
)

let webpackManifest

async function context(request) {
  const authedUser =
    (await request.getUserSession(request, request.state?.userSession)) || {}

  const translations = request.app.translations || {}
  const currentLang = request.app.currentLang || 'en'

  const organisationName = authedUser.organisationName
  let userPermissions

  // Only translate if the full organisationName exists in translations
  let displayOrgName = organisationName
  if (currentLang === 'cy' && translations.laNames?.[organisationName]) {
    displayOrgName = translations.laNames[organisationName]
  }

  authedUser.organisationName = displayOrgName

  let bankApiData = null

  try {
    const authorizationConfig = await fetchWithToken(
      request,
      '/permissions/config'
    )
    userPermissions = mapPermissions(
      authorizationConfig,
      authedUser?.currentRole
    )
  } catch (error) {
    request.logger.error(error, `Failed to fetch permissions config:`)
  }

  try {
    const bankPath = `/bank-details/${authedUser.organisationId}`
    bankApiData = await fetchWithToken(request, bankPath)
    request.logger.info(
      `Successfully fetched bank details for ${organisationName}`
    )
  } catch (err) {
    request.logger.error(`Failed to fetch apiData in context:`, err)
  }

  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const navigation = await buildNavigation(request)
  const sessionTimer = config.get('sessionTimer') * 60 * 1000
  return {
    authedUser,
    bankApiData,
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    breadcrumbs: [],
    currentLang,
    translations,
    userPermissions,
    navigation,
    sessionTimer,
    showBetaBanner: config.get('showBetaBanner'),
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}

export { context }

const rolesMap = {
  'Chief Executive Officer': 'CEO',
  'Head of Finance': 'HOF',
  'Head of Waste': 'HOW',
  'Waste Officer': 'WO',
  'Finance Officer': 'FO'
}

function mapPermissions(permissionObj, userRole) {
  const mappedRole = rolesMap[userRole]
  const result = {}
  for (const action in permissionObj) {
    if (Object.hasOwn(permissionObj, action)) {
      result[action] = permissionObj[action].includes(mappedRole)
    }
  }

  return result
}
