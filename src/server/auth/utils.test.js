import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as utils from './utils'
import Wreck from '@hapi/wreck'
import jwtDecode from 'jwt-decode'
import { config } from '../../config/config.js'

// Mock @hapi/wreck
vi.mock('@hapi/wreck', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    get: vi.fn() // flattened, no default
  }
})

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
  default: vi.fn()
}))

describe.skip('#utils', () => {
  let request

  beforeEach(() => {
    request = {
      auth: {
        credentials: { token: 'test-token' }
      },
      state: {
        userSession: { token: 'state-token' }
      }
    }
  })

  describe('getToken', () => {
    it('returns token from auth.credentials', () => {
      const { token } = utils.getToken(request)
      expect(token).toBe('test-token')
    })

    it('returns token from state if auth is missing', () => {
      delete request.auth
      const { token } = utils.getToken(request)
      expect(token).toBe('state-token')
    })

    it('throws Unauthorized if no token', () => {
      delete request.auth
      delete request.state
      expect(() => utils.getToken(request)).toThrow('Unauthorized')
    })
  })

  describe('fetchWithToken', () => {
    const path = '/some-url'
    const apiBaseUrl = 'http://example.com'

    beforeEach(() => {
      // Mock config.get to return API base URL
      vi.spyOn(config, 'get').mockImplementation((key) => {
        if (key === 'back') return apiBaseUrl
        return null
      })
    })

    it('calls Wreck.get with correct URL and headers', async () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: 'mock-token' })
      Wreck.get.mockResolvedValue({ payload: { success: true } })

      const result = await utils.fetchWithToken(request, path)

      expect(utils.getToken).toHaveBeenCalledWith(request)
      expect(Wreck.get).toHaveBeenCalledWith(`${apiBaseUrl}${path}`, {
        headers: { Authorization: 'Bearer mock-token' },
        json: true
      })
      expect(result).toEqual({ payload: { success: true } })
    })
  })

  describe('getRoleFromToken', () => {
    it('extracts role from token', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: 'mock-token' })
      jwtDecode.mockReturnValue({ roles: ['org:admin'] })

      const role = utils.getRoleFromToken(request)
      expect(role).toBe('admin')
    })

    it('returns null if no roles', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: 'mock-token' })
      jwtDecode.mockReturnValue({ roles: [] })

      const role = utils.getRoleFromToken(request)
      expect(role).toBeNull()
    })

    it('returns null if jwtDecode fails', () => {
      vi.spyOn(utils, 'getToken').mockReturnValue({ token: 'mock-token' })
      jwtDecode.mockImplementation(() => {
        throw new Error('invalid')
      })

      const role = utils.getRoleFromToken(request)
      expect(role).toBeNull()
    })
  })
})
