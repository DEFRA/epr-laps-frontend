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

  const displayName = [payload.firstName, payload.lastName]
    .filter(Boolean)
    .join(' ')

  return { organisationName, displayName, organisationId }
}

export const extractRoleName = (payload) => {
  const roles = payload.roles

  if (!Array.isArray(roles) || roles.length === 0) {
    console.log('No roles found in payload or roles is not an array')
    return { currentRole: null }
  }

  // Multiple roles case - normalise and resolve effective role
  if (roles.length > 1) {
    const mappedRoles = normaliseRoles(roles)
    return {
      currentRole: resolveEffectiveRole(mappedRoles)
    }
  }

  // Single role case
  const matchedRole = roles.find((role) => {
    const [relationshipId] = role.split(':')
    return relationshipId === payload.currentRelationshipId
  })

  if (!matchedRole) {
    return { currentRole: null }
  }

  const parts = matchedRole.split(':')
  const currentRole = parts.length >= 2 ? parts[1] : matchedRole

  return { currentRole }
}

/**
 * Extracts unique role names from a list of role strings and returns them
 * as a comma-separated string.
 *
 * Each role string is expected to follow the format:
 *   "<organisationId>:<roleName>:<level>"
 *
 * @param {string[]} [roles=[]] - Array of colon-delimited role strings.
 * @returns {string} A comma-separated list of unique role names.
 */
export function extractRawRoles(roles = []) {
  const result = []

  for (const role of roles) {
    const name = role.split(':')[1]
    if (name && !result.includes(name)) {
      result.push(name)
    }
  }

  return result.join(', ')
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

      const { organisationName, displayName, organisationId } =
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
        currentRole,
        roles: payload.roles,
        rawRoles: extractRawRoles(payload.roles),
        idToken: params.id_token,
        tokenUrl: oidcConf.token_endpoint,
        logoutUrl: oidcConf.end_session_endpoint
      }
    }
  }
}

const rolesMap = {
  'Chief Executive Officer': 'CEO',
  'Head of Finance': 'HOF',
  'Head of Waste': 'HOW',
  'Waste Officer': 'WO',
  'Finance Officer': 'FO'
}

const rolePriority = {
  HOF: 1,
  CEO: 2,
  HOW: 3,
  FO: 4,
  WO: 5
}

export function normaliseRoles(rawRoles) {
  const roles = Array.isArray(rawRoles) ? rawRoles : [rawRoles]

  return roles
    .map((roleEntry) => {
      if (!roleEntry || typeof roleEntry !== 'string') {
        return null
      }

      const parts = roleEntry.split(':')
      const roleName = parts.length >= 2 ? parts[1].trim() : roleEntry.trim()
      return rolesMap[roleName]
    })
    .filter(Boolean)
}

export function resolveEffectiveRole(mappedRoles) {
  if (mappedRoles.length === 0) {
    return null
  }
  if (mappedRoles.length === 1) {
    return mappedRoles[0]
  }

  return [...mappedRoles].sort((a, b) => rolePriority[a] - rolePriority[b])[0]
}
