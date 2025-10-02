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

  // Only translate if the full organisationName exists in translations
  let displayOrgName = organisationName
  if (currentLang === 'cy' && translations.laNames?.[organisationName]) {
    displayOrgName = translations.laNames[organisationName]
  }

  authedUser.organisationName = displayOrgName

  let apiData = null

  if (authedUser?.currentRole === 'Head of Finance') {
    try {
      const bankPath = `/bank-details/${encodeURIComponent(organisationName)}`
      apiData = await fetchWithToken(request, bankPath)
      request.logger.info(
        `Successfully fetched bank details for ${organisationName}`
      )
    } catch (err) {
      request.logger.error(`Failed to fetch apiData in context:`, err)
    }
  }

  if (!webpackManifest) {
    try {
      webpackManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'))
    } catch (error) {
      logger.error(`Webpack ${path.basename(manifestPath)} not found`)
    }
  }

  const navigation = await buildNavigation(request)
  return {
    authedUser,
    apiData,
    assetPath: `${assetPath}/assets`,
    serviceName: config.get('serviceName'),
    serviceUrl: '/',
    breadcrumbs: [],
    currentLang,
    translations,
    navigation,
    showBetaBanner: config.get('showBetaBanner'),
    getAssetPath(asset) {
      const webpackAssetPath = webpackManifest?.[asset]
      return `${assetPath}/${webpackAssetPath ?? asset}`
    }
  }
}

export { context }
