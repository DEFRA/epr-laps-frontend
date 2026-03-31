import jwt from '@hapi/jwt'
import {
  openIdProvider,
  extractUserOrgDetails,
  extractRoleName,
  extractRawRoles
} from './open-id.js'

describe('#openIdProvider', () => {
  let provider

  beforeAll(() => {
    const oidcConf = {
      authorization_endpoint: 'http://test-auth-endpoint',
      token_endpoint: 'http://test-token-endpoint',
      end_session_endpoint: 'http://test-end-session-endpoint'
    }
    provider = openIdProvider('defraId', oidcConf)
  })

  test('When credentials exist', async () => {
    const token = jwt.token.generate(
      {
        sub: 'testSub',
        correlationId: 'testCorrelationId',
        sessionId: 'testSessionId',
        contactId: 'testContactId',
        serviceId: 'testServiceId',
        firstName: 'Test',
        lastName: 'User',
        email: 'testEmail',
        uniqueReference: 'testUniqueRef',
        loa: 'testLoa',
        aal: 'testAal',
        enrolmentCount: 1,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'rel-123',
        relationships: ['rel-123:role:Mocked Organisation'],
        roles: ['testRole'],
        aud: 'test',
        iss: 'test',
        user: 'Test User'
      },
      {
        key: 'test',
        algorithm: 'HS256'
      },
      {
        ttlSec: 1
      }
    )

    const credentials = { token }

    await provider.profile(credentials, { id_token: 'test-id-token' }, {})

    expect(credentials.profile).not.toBeNull()
    expect(credentials.profile.organisationName).toBe('Mocked Organisation')
    expect(credentials.profile.roles).toEqual(['testRole'])
    expect(credentials.profile.relationships).toEqual([
      'rel-123:role:Mocked Organisation'
    ])
    expect(credentials.profile).toEqual(
      expect.objectContaining({
        id: 'testSub',
        correlationId: 'testCorrelationId',
        sessionId: 'testSessionId',
        contactId: 'testContactId',
        serviceId: 'testServiceId',
        firstName: 'Test',
        lastName: 'User',
        displayName: 'Test User',
        email: 'testEmail',
        uniqueReference: 'testUniqueRef',
        loa: 'testLoa',
        aal: 'testAal',
        enrolmentCount: 1,
        enrolmentRequestCount: 1,
        currentRelationshipId: 'rel-123',
        relationships: ['rel-123:role:Mocked Organisation'],
        roles: ['testRole'],
        idToken: 'test-id-token',
        tokenUrl: 'http://test-token-endpoint',
        logoutUrl: 'http://test-end-session-endpoint'
      })
    )
  })

  test('When credential do not exist', () => {
    expect(() => provider.profile({ credentials: null }, {}, {})).toThrow(
      'Auth Access Token not present. Unable to retrieve profile.'
    )
    expect(() => provider.profile({ credentials: {} }, {}, {})).toThrow(
      'Auth Access Token not present. Unable to retrieve profile.'
    )
    expect(() =>
      provider.profile({ credentials: { token: null } }, {}, {})
    ).toThrow('Auth Access Token not present. Unable to retrieve profile.')
  })

  test('Should fallback to Local Authority when no relationships array', async () => {
    const token = jwt.token.generate(
      {
        sub: 'testSub',
        currentRelationshipId: null,
        relationships: null,
        firstName: 'Test',
        lastName: 'User',
        sessionId: 'testSessionId'
      },
      { key: 'test', algorithm: 'HS256' },
      { ttlSec: 1 }
    )

    const credentials = { token }
    await provider.profile(credentials, { id_token: 'id-token' }, {})
    expect(credentials.profile.organisationName).toBe('Local Authority')
  })
})

describe('#extractUserOrgDetails', () => {
  test('Should return organisation name when relationship matches', () => {
    const payload = {
      currentRelationshipId: '123',
      relationships: ['123:456:MyOrg:0:employee:0']
    }
    expect(extractUserOrgDetails(payload).organisationName).toBe('MyOrg')
  })

  test('Should fallback to Local Authority when no relationships', () => {
    const payload = {
      currentRelationshipId: null,
      relationships: null
    }
    expect(extractUserOrgDetails(payload).organisationName).toBe(
      'Local Authority'
    )
  })

  test('Should fallback to Local Authority when relationship does not match', () => {
    const payload = {
      currentRelationshipId: '999',
      relationships: ['123:456:OtherOrg:0:employee:0']
    }
    expect(extractUserOrgDetails(payload).organisationName).toBe(
      'Local Authority'
    )
  })

  test('Should handle malformed relationship strings gracefully', () => {
    const payload = {
      currentRelationshipId: '123',
      relationships: ['123']
    }
    expect(extractUserOrgDetails(payload).organisationName).toBe(
      'Local Authority'
    )
  })

  test('Should return organisation id', () => {
    const payload = {
      currentRelationshipId: '9999',
      relationships: [
        '123:456:MyOrg:0:employee:0',
        '9999:abcd-12345:Test Organization:0:employee:0'
      ]
    }
    expect(extractUserOrgDetails(payload).organisationId).toBe('abcd-12345')
  })
})

describe('#extractRoleName', () => {
  test('Should return null when roles array is missing', () => {
    const payload = { currentRelationshipId: '123' }
    expect(extractRoleName(payload).currentRole).toBeNull()
  })

  test('Should return null when roles array is empty', () => {
    const payload = { currentRelationshipId: '123', roles: [] }
    expect(extractRoleName(payload).currentRole).toBeNull()
  })

  test('Should return null when no role matches currentRelationshipId', () => {
    const payload = { currentRelationshipId: '123', roles: ['999:Admin'] }
    expect(extractRoleName(payload).currentRole).toBeNull()
  })

  test('Should return correct role when matching role exists', () => {
    const payload = { currentRelationshipId: '123', roles: ['123:Admin'] }
    expect(extractRoleName(payload).currentRole).toBe('Admin')
  })

  test('Should handle role string without colon gracefully', () => {
    const payload = { currentRelationshipId: '123', roles: ['123'] }
    expect(extractRoleName(payload).currentRole).toBe('123')
  })

  test('Should ignore other roles and return only the matching one', () => {
    const payload = {
      currentRelationshipId: '123',
      roles: ['999:User', '123:Manager', '456:Admin']
    }
    expect(extractRoleName(payload).currentRole).toBe('Manager')
  })
})

describe('#extractRawRoles', () => {
  it('returns an empty array when no roles are provided', () => {
    expect(extractRawRoles()).toEqual('')
  })

  it('extracts the role name from a single role string', () => {
    const roles = ['org-1:CEO:3']

    expect(extractRawRoles(roles)).toEqual('CEO')
  })

  it('extracts unique role names and removes duplicates', () => {
    const roles = ['org-1:CEO:3', 'org-2:CEO:2', 'org-3:ADMIN:1']

    expect(extractRawRoles(roles)).toEqual('CEO, ADMIN')
  })

  it('preserves the order of first occurrence', () => {
    const roles = ['org-1:ADMIN:1', 'org-2:CEO:3', 'org-3:ADMIN:2']

    expect(extractRawRoles(roles)).toEqual('ADMIN, CEO')
  })

  it('ignores malformed role strings with missing role name', () => {
    const roles = ['org-1::3', 'org-2:CEO:1', 'invalid']

    expect(extractRawRoles(roles)).toEqual('CEO')
  })

  it('returns an empty array when all role strings are malformed', () => {
    const roles = ['invalid', 'org-1::3', ':::']

    expect(extractRawRoles(roles)).toEqual('')
  })
})
