import { vi } from 'vitest'
import { config } from '../../config.js'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()
const mockgetUserSession = vi.fn()
const mockGetRoleFromToken = vi.fn()

const manageDefraAccountUrl =
  'https://your-account.cpdev.cui.defra.gov.uk/management'

// Mock node:fs
vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')
  return {
    ...nodeFs,
    readFileSync: () => mockReadFileSync()
  }
})

// Mock logger
vi.mock('../../../server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({ error: (...args) => mockLoggerError(...args) })
}))

// Mock getRoleFromToken
vi.mock('../../../server/auth/utils.js', () => ({
  getRoleFromToken: (...args) => mockGetRoleFromToken(...args)
}))

describe('context and cache', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()
    mockgetUserSession.mockReset()
    mockGetRoleFromToken.mockReset()
    vi.resetModules()

    config.get = vi.fn().mockImplementation((key) => {
      const configValues = {
        root: '/',
        assetPath: '/public',
        serviceName: 'EPR-LAPs',
        showBetaBanner: true,
        'defraId.manageAccountUrl': manageDefraAccountUrl
      }
      return configValues[key]
    })

    mockGetRoleFromToken.mockReturnValue('HOF')
  })

  const mockRequest = {
    path: '/?lang=en',
    app: {
      translations: {
        'your-defra-acco': 'Your Defra account',
        'sign-out': 'Sign out'
      },
      currentLang: 'en'
    },
    getUserSession: mockgetUserSession,
    state: {
      userSession: null
    }
  }

  describe('#context', () => {
    describe('When webpack manifest file read succeeds', () => {
      let contextImport
      let contextResult

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        // Return JSON string
        mockReadFileSync.mockReturnValue(`{
          "application.js": "javascripts/application.js",
          "stylesheets/application.scss": "stylesheets/application.css"
        }`)

        contextResult = await contextImport.context(mockRequest)
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          authedUser: undefined,
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: false,
              text: 'Your Defra account',
              href: manageDefraAccountUrl
            },
            {
              current: false,
              text: 'Sign out',
              href: '/sign-out'
            }
          ],
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true,
          roleName: 'HOF'
        })
      })

      test('Should provide correct asset path for valid assets', () => {
        expect(contextResult.getAssetPath('application.js')).toBe(
          '/public/javascripts/application.js'
        )
      })

      test('Should provide correct asset path for missing assets', () => {
        expect(contextResult.getAssetPath('an-image.png')).toBe(
          '/public/an-image.png'
        )
      })
    })

    describe('When webpack manifest file read fails', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        mockReadFileSync.mockImplementation(() => {
          throw new Error('File not found')
        })

        await contextImport.context(mockRequest)
      })

      test('Should log that the Webpack Manifest file is not available', () => {
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Webpack assets-manifest.json not found'
        )
      })
    })
  })

  describe('#context cache', () => {
    describe('Webpack manifest file cache', () => {
      let contextImport
      let contextResult

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        mockReadFileSync.mockReturnValue(`{
          "application.js": "javascripts/application.js",
          "stylesheets/application.scss": "stylesheets/application.css"
        }`)

        contextResult = await contextImport.context(mockRequest)
      })

      test('Should read file only once initially', () => {
        expect(mockReadFileSync).toHaveBeenCalledTimes(1)
      })

      test('Should use cache on subsequent calls', async () => {
        mockReadFileSync.mockClear()
        await contextImport.context(mockRequest)
        expect(mockReadFileSync).not.toHaveBeenCalled()
      })

      test('Should provide expected context from cache', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
          authedUser: undefined,
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: false,
              text: 'Your Defra account',
              href: manageDefraAccountUrl
            },
            {
              current: false,
              text: 'Sign out',
              href: '/sign-out'
            }
          ],
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true,
          roleName: 'HOF'
        })
      })
    })
  })
})
