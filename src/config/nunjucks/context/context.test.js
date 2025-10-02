import { vi } from 'vitest'
import { config } from '../../config.js'

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()
const mockgetUserSession = vi.fn().mockResolvedValue({
  relationships: []
})

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

describe('context and cache', () => {
  beforeEach(() => {
    mockReadFileSync.mockReset()
    mockLoggerError.mockReset()
    mockgetUserSession.mockReset()
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
  })

  const EN_NAME = 'Some Council Name'
  const CY_NAME = 'Cyngor Rhai Enw'

  describe('#context', () => {
    const mockRequest = {
      path: '/?lang=en',
      app: {
        translations: {
          'your-defra-acco': 'Your Defra account',
          'sign-out': 'Sign out',
          laNames: {
            [EN_NAME]: CY_NAME
          }
        },
        currentLang: 'en'
      },
      getUserSession: vi.fn().mockResolvedValue({
        organisationName: EN_NAME,
        relationships: []
      }),
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
          authedUser: {
            organisationName: EN_NAME,
            relationships: []
          },
          apiData: null,
          assetPath: '/public/assets',
          breadcrumbs: [],
          currentLang: 'en',
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
              href: '/sign-out?lang=en'
            }
          ],
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true,
          translations: {
            laNames: { [EN_NAME]: CY_NAME },
            'sign-out': 'Sign out',
            'your-defra-acco': 'Your Defra account'
          }
        })
      })

      describe('organisationName translation', () => {
        it('should translate organisationName to Welsh if language is cy and translation exists', async () => {
          const req = {
            ...mockRequest,
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: EN_NAME,
              relationships: []
            }),
            app: {
              ...mockRequest.app,
              currentLang: 'cy',
              translations: {
                ...mockRequest.app.translations,
                laNames: { [EN_NAME]: CY_NAME } //dynamic
              }
            }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          expect(ctx.authedUser.organisationName).toBe(CY_NAME)
        })

        it('should not translate if organisationName does not exist in translations', async () => {
          const req = {
            ...mockRequest,
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: 'Unknown Council',
              relationships: []
            }),
            app: {
              ...mockRequest.app,
              currentLang: 'cy',
              translations: {
                ...mockRequest.app.translations,
                laNames: {}
              }
            }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          expect(ctx.authedUser.organisationName).toBe('Unknown Council')
        })

        it('should not translate if language is English', async () => {
          const req = {
            ...mockRequest,
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: EN_NAME,
              relationships: []
            }),
            app: {
              ...mockRequest.app,
              currentLang: 'en',
              translations: {
                ...mockRequest.app.translations,
                laNames: { [EN_NAME]: CY_NAME }
              }
            }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })
      })

      describe('branch coverage extras', () => {
        it('should default to {} when translations is missing', async () => {
          const req = {
            ...mockRequest,
            app: {}, // no translations
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: 'Fallback Council',
              relationships: []
            })
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          expect(ctx.authedUser.organisationName).toBe('Fallback Council')
        })

        it('should default to "en" when currentLang is missing', async () => {
          const req = {
            ...mockRequest,
            app: { translations: mockRequest.app.translations }, // no currentLang
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: EN_NAME,
              relationships: []
            })
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          // stays as original because currentLang defaults to 'en'
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })

        it('should handle when laNames is undefined', async () => {
          const req = {
            ...mockRequest,
            app: {
              ...mockRequest.app,
              currentLang: 'cy',
              translations: {} // no laNames key
            },
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: EN_NAME,
              relationships: []
            })
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)

          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
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

    describe('branch coverage extras', () => {
      it('should default authedUser to {} when getUserSession returns null', async () => {
        const req = {
          ...mockRequest,
          getUserSession: vi.fn().mockResolvedValue({ relationships: [] })
        }
        const contextImport = await import('./context.js')
        const ctx = await contextImport.context(req)

        expect(ctx.authedUser).toEqual({ relationships: [] })
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
          laNames: { [EN_NAME]: CY_NAME },
          'your-defra-acco': 'Your Defra account',
          'sign-out': 'Sign out'
        },
        currentLang: 'en'
      },
      getUserSession: vi.fn().mockResolvedValue({
        organisationName: EN_NAME,
        relationships: []
      }),
      state: {
        userSession: null
      },
      logger: {
        info: vi.fn(),
        error: vi.fn()
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
          authedUser: {
            organisationName: EN_NAME,
            relationships: []
          },
          apiData: null,
          assetPath: '/public/assets',
          breadcrumbs: [],
          currentLang: 'en',
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
              href: '/sign-out?lang=en'
            }
          ],
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          showBetaBanner: true,
          translations: {
            laNames: { [EN_NAME]: CY_NAME },
            'sign-out': 'Sign out',
            'your-defra-acco': 'Your Defra account'
          }
        })
      })
    })
  })
})
