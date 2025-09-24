import { vi } from 'vitest'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()
const mockgetUserSession = vi.fn()

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

describe('context and cache', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()
    mockgetUserSession.mockReset()
    vi.resetModules()
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
          authedUser: undefined,
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: false,
              text: 'Your Defra account',
              href: '/defra-account'
            },
            { current: false, text: 'Sign out', href: '/sign-out' }
          ],
          roleName: null,
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true
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
          authedUser: undefined,
          breadcrumbs: [],
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: false,
              text: 'Your Defra account',
              href: '/defra-account'
            },
            { current: false, text: 'Sign out', href: '/sign-out' }
          ],
          roleName: null,
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true
        })
      })
    })
  })
})
