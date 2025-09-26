import { vi } from 'vitest'
import { config } from '../../config.js'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()
const mockgetUserSession = vi.fn()
const mockGetRoleFromToken = vi.fn()

const manageDefraAccountUrl =
  'https://your-account.cpdev.cui.defra.gov.uk/management'

vi.mock('node:fs', async () => {
  const nodeFs = await import('node:fs')

  return {
    ...nodeFs,
    readFileSync: () => mockReadFileSync()
  }
})
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

  describe('#context', () => {
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

      describe('With valid asset path', () => {
        test('Should provide expected asset path', () => {
          expect(contextResult.getAssetPath('application.js')).toBe(
            '/public/javascripts/application.js'
          )
        })
      })

      describe('With invalid asset path', () => {
        test('Should provide expected asset', () => {
          expect(contextResult.getAssetPath('an-image.png')).toBe(
            '/public/an-image.png'
          )
        })
      })
    })

    describe('When webpack manifest file read fails', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        mockReadFileSync.mockReturnValue(new Error('File not found'))

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

    describe('Webpack manifest file cache', () => {
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

      test('Should read file', () => {
        expect(mockReadFileSync).toHaveBeenCalledTimes(1)
      })

      test('Should use cache on second call', () => {
        mockReadFileSync.mockClear()

        contextImport.context(mockRequest)

        expect(mockReadFileSync).not.toHaveBeenCalled()
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          assetPath: '/public/assets',
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

  describe('#context edge cases', () => {
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

    let contextImport
    beforeAll(async () => {
      contextImport = await import('./context.js')
    })

    describe('When webpack manifest contains invalid JSON', () => {
      beforeEach(async () => {
        mockReadFileSync.mockImplementation(() => '{ invalid json }')

        await contextImport.context(mockRequest)
      })

      test('Should log an error because JSON.parse fails', () => {
        expect(mockLoggerError).toHaveBeenCalledWith(
          'Webpack assets-manifest.json not found'
        )
      })
    })

    describe('When user session exists', () => {
      beforeEach(async () => {
        mockReadFileSync.mockReturnValue(`{
          "application.js": "javascripts/application.js"
        }`)
        mockgetUserSession.mockResolvedValue({
          id: 'user123',
          name: 'Test User'
        })
      })

      test('Should include authedUser in context', async () => {
        const ctx = await contextImport.context(mockRequest)
        expect(ctx.authedUser).toEqual({ id: 'user123', name: 'Test User' })
      })
    })

    describe('When showBetaBanner is false', () => {
      let contextImport

      beforeEach(async () => {
        vi.resetModules()

        vi.doMock('../../config.js', () => ({
          config: {
            get: vi.fn((key) => {
              const values = {
                root: '/',
                assetPath: '/public',
                serviceName: 'EPR-LAPs',
                showBetaBanner: false,
                'defraId.manageAccountUrl': manageDefraAccountUrl
              }
              return values[key]
            })
          }
        }))

        mockReadFileSync.mockReturnValue(`{
          "application.js": "javascripts/application.js"
        }`)

        contextImport = await import('./context.js')
      })

      test('Should reflect showBetaBanner = false in context', async () => {
        const ctx = await contextImport.context(mockRequest)
        expect(ctx.showBetaBanner).toBe(false)
      })
    })
  })
})
