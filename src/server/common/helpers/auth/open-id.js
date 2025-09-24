import Jwt from '@hapi/jwt'
import { config } from '../../../../config/config.js'

const RELATIONSHIP_PARTS_MIN = 3 // minimum number of parts in a relationship string
const ORG_NAME_INDEX = 2 // index of organisation name in the relationship string

function extractOrgName(payload) {
  let organisationName = 'Local Authority'

  if (Array.isArray(payload.relationships) && payload.currentRelationshipId) {
    const matched = payload.relationships.find((rel) => {
      const parts = rel.split(':')
      return parts[0] === payload.currentRelationshipId
    })

    if (matched) {
      const parts = matched.split(':')
      if (parts.length >= RELATIONSHIP_PARTS_MIN) {
        organisationName = parts[ORG_NAME_INDEX]
      }
    }
  } else {
    console.warn(
      'No relationships or no currentRelationshipId in payload',
      payload
    )
  }

  const displayName = [payload.firstName, payload.lastName]
    .filter(Boolean)
    .join(' ')

  return { organisationName, displayName }
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

      const { organisationName, displayName } = extractOrgName(payload)

      credentials.profile = {
        id: payload.sub,
        correlationId: payload.correlationId,
        sessionId: payload.sessionId,
        contactId: payload.contactId,
        serviceId: payload.serviceId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName,
        email: payload.email,
        uniqueReference: payload.uniqueReference,
        loa: payload.loa,
        aal: payload.aal,
        enrolmentCount: payload.enrolmentCount,
        enrolmentRequestCount: payload.enrolmentRequestCount,
        currentRelationshipId: payload.currentRelationshipId,
        relationships: payload.relationships,
        organisationName,
        roles: payload.roles,
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint
      }
    }
  }
}
