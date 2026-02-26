import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { robotsTxt } from './robots-txt.js'

vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    promises: {
      readFile: vi.fn()
    }
  }
})

describe('robots.txt Plugin', () => {
  let mockServer

  beforeEach(() => {
    mockServer = {
      route: vi.fn(),
      logger: {
        info: vi.fn(),
        warn: vi.fn()
      }
    }
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('#robotsTxt Hapi Plugin', () => {
    test('should have correct plugin metadata', () => {
      expect(robotsTxt.name).toBe('robots-txt')
      expect(robotsTxt.version).toBe('1.0.0')
      expect(typeof robotsTxt.register).toBe('function')
    })

    test('should register a route for /robots.txt', async () => {
      const { promises } = await import('fs')
      vi.mocked(promises.readFile).mockResolvedValue(
        'User-agent: *\nDisallow: /\n'
      )

      await robotsTxt.register(mockServer)

      expect(mockServer.route).toHaveBeenCalledTimes(1)
      const routeCall = mockServer.route.mock.calls[0][0]
      expect(routeCall.method).toBe('GET')
      expect(routeCall.path).toBe('/robots.txt')
      expect(typeof routeCall.handler).toBe('function')
    })

    test('should set auth to false for public access', async () => {
      const { promises } = await import('fs')
      vi.mocked(promises.readFile).mockResolvedValue(
        'User-agent: *\nDisallow: /\n'
      )

      await robotsTxt.register(mockServer)

      const routeCall = mockServer.route.mock.calls[0][0]
      expect(routeCall.options.auth).toBe(false)
    })

    test('should set cache options for 1 week', async () => {
      const { promises } = await import('fs')
      vi.mocked(promises.readFile).mockResolvedValue(
        'User-agent: *\nDisallow: /\n'
      )

      await robotsTxt.register(mockServer)

      const routeCall = mockServer.route.mock.calls[0][0]
      expect(routeCall.options.cache.privacy).toBe('public')
    })

    test('should set correct HTTP headers on response', async () => {
      const { promises } = await import('fs')
      const content = 'User-agent: *\nDisallow: /admin\n'
      vi.mocked(promises.readFile).mockResolvedValue(content)

      await robotsTxt.register(mockServer)
      const routeCall = mockServer.route.mock.calls[0][0]

      const mockH = {
        response: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        code: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis()
      }

      await routeCall.handler({}, mockH)

      expect(mockH.response).toHaveBeenCalledWith(content)
      expect(mockH.type).toHaveBeenCalledWith('text/plain')
      expect(mockH.code).toHaveBeenCalledWith(200)
    })

    test('should log plugin registration', async () => {
      const { promises } = await import('fs')
      vi.mocked(promises.readFile).mockResolvedValue(
        'User-agent: *\nDisallow: /\n'
      )

      await robotsTxt.register(mockServer)

      expect(mockServer.logger.info).toHaveBeenCalledWith(
        'Robots.txt plugin registered'
      )
    })

    test('should handle file read errors gracefully', async () => {
      const { promises } = await import('fs')
      const error = new Error('ENOENT: no such file')
      vi.mocked(promises.readFile).mockRejectedValue(error)

      await robotsTxt.register(mockServer)

      expect(mockServer.logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('Failed to read robots.txt')
      )

      // Verify fallback content is used
      const routeCall = mockServer.route.mock.calls[0][0]
      const mockH = {
        response: vi.fn().mockReturnThis(),
        type: vi.fn().mockReturnThis(),
        code: vi.fn().mockReturnThis(),
        header: vi.fn().mockReturnThis()
      }

      await routeCall.handler({}, mockH)
      const responseContent = mockH.response.mock.calls[0][0]
      expect(responseContent).toBe('User-agent: *\nDisallow: /\n')
    })

    test('should handle missing logger gracefully', async () => {
      const { promises } = await import('fs')
      vi.mocked(promises.readFile).mockResolvedValue(
        'User-agent: *\nDisallow: /\n'
      )

      const serverWithoutLogger = {
        route: vi.fn()
      }

      await expect(
        robotsTxt.register(serverWithoutLogger)
      ).resolves.not.toThrow()

      expect(serverWithoutLogger.route).toHaveBeenCalledTimes(1)
    })
  })
})
