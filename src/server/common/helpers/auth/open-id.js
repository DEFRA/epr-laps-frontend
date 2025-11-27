import Jwt from '@hapi/jwt'
import { config } from '../../../../config/config.js'
import { createLogger } from '../logging/logger.js'

const logger = createLogger()

const RELATIONSHIP_PARTS_MIN = 3 // minimum number of parts in a relationship string
const ORG_NAME_INDEX = 2 // index of organisation name in the relationship string
const ORG_ID_INDEX = 1 // index of organisation id in the relationship string

export function extractUserOrgDetails(payload) {
  let organisationName = 'Local Authority'
  let organisationId

  if (Array.isArray(payload.relationships) && payload.currentRelationshipId) {
    const matched = payload.relationships.find((rel) => {
      const parts = rel.split(':')
      return parts[0] === payload.currentRelationshipId
    })

    if (matched) {
      const parts = matched.split(':')
      if (parts.length >= RELATIONSHIP_PARTS_MIN) {
        organisationName = parts[ORG_NAME_INDEX]
        organisationId = parts[ORG_ID_INDEX]
      }
    }
  } else {
    logger.warn(
      'No relationships or no currentRelationshipId in payload',
      payload
    )
  }

  console.log('THE PAYLOAD:', payload)
  const displayEmail = payload.email

  return { organisationName, displayEmail, organisationId }
}

export const extractRoleName = (payload) => {
  const roles = payload.roles
  if (!Array.isArray(roles) || roles.length === 0) {
    return { currentRole: null }
  }

  // Find the matching role string
  const matchedRole = roles.find((role) => {
    const roleParts = role.split(':')
    return roleParts[0] === payload.currentRelationshipId
  })

  if (!matchedRole) {
    return { currentRole: null }
  }

  const parts = matchedRole.split(':')
  const currentRole = parts.length >= 2 ? parts[1] : matchedRole

  return { currentRole }
}

export const openIdProvider = (name, oidcConf) => {
  const authConfig = config.get('defraId')
  return {
    name,
    protocol: 'oauth2',
    useParamsAuth: true,
    auth: oidcConf.authorization_endpoint,
    token: oidcConf.token_endpoint,
    pkce: 'S256',
    scope: [...authConfig.scopes, authConfig.clientId],
    profile: (credentials, params) => {
      if (!credentials?.token) {
        throw new Error(
          `Auth Access Token not present. Unable to retrieve profile.`
        )
      }

      const payload = Jwt.token.decode(credentials.token).decoded.payload

      const { organisationName, displayEmail, organisationId } =
        extractUserOrgDetails(payload)
      const { currentRole } = extractRoleName(payload)

      credentials.profile = {
        id: payload.sub,
        correlationId: payload.correlationId,
        organisationId,
        sessionId: payload.sessionId,
        contactId: payload.contactId,
        serviceId: payload.serviceId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayEmail,
        email: payload.email,
        uniqueReference: payload.uniqueReference,
        loa: payload.loa,
        aal: payload.aal,
        enrolmentCount: payload.enrolmentCount,
        enrolmentRequestCount: payload.enrolmentRequestCount,
        currentRelationshipId: payload.currentRelationshipId,
        relationships: payload.relationships,
        organisationName,
        currentRole,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint
      }
    }
  }
}
