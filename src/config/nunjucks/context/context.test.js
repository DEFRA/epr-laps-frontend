import { vi, describe, beforeEach, test, expect } from 'vitest'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()

// Mock fs BEFORE importing the module that uses it
vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')
  return {
    ...nodeFs,
    readFileSync: (...args) => mockReadFileSync(...args)
  }
})

// Mock logger
vi.mock('../../../server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

describe('context and cache', () => {
  let contextImport

  beforeEach(async () => {
    vi.resetModules()
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()

    // Set default return for manifest
    mockReadFileSync.mockReturnValue(`{
      "application.js": "javascripts/application.js",
      "stylesheets/application.scss": "stylesheets/application.css"
    }`)

    contextImport = await import('./context.js')
  })

  const mockRequest = {
    path: '/',
    app: {
      translations: {
        'your-defra-acco': 'Your Defra account',
        'sign-out': 'Sign out'
      }
    }
  }

  describe('#context', () => {
    test('Should provide expected context', () => {
      const result = contextImport.context(mockRequest)

      expect(result).toEqual({
        assetPath: '/public/assets',
        breadcrumbs: [],
        getAssetPath: expect.any(Function),
        navigation: [
          {
            current: false,
            text: 'Your Defra account',
            href: '/defra-account'
          },
          {
            current: false,
            text: 'Sign out',
            href: '/sign-out'
          }
        ],
        serviceName: '',
        serviceUrl: '/'
      })
    })
  })

  describe('#context cache', () => {
    test('Should read file on first call', () => {
      contextImport.context(mockRequest)
      expect(mockReadFileSync).toHaveBeenCalledTimes(1)
    })

    test('Should use cache on second call', () => {
      contextImport.context(mockRequest)
      mockReadFileSync.mockClear()

      contextImport.context(mockRequest)

      expect(mockReadFileSync).not.toHaveBeenCalled()
    })
  })

  describe('When manifest file read fails', () => {
    test('Should log error when manifest not found', async () => {
      vi.resetModules()
      mockReadFileSync.mockReset()
      mockLoggerError.mockReset()

      // Simulate file read failure
      mockReadFileSync.mockImplementation(() => {
        throw new Error('File not found')
      })

      const context = (await import('./context.js')).context
      context(mockRequest)

      expect(mockLoggerError).toHaveBeenCalledWith(
        'Webpack assets-manifest.json not found'
      )
    })
  })
})
