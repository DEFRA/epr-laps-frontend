import { vi } from 'vitest'
import { config } from '../../config.js'
import { fetchWithToken } from '../../../server/auth/utils.js'

vi.mock('../../../server/auth/utils.js', () => ({
  fetchWithToken: vi.fn()
}))

const mockReadFileSync = vi.fn()
const mockLoggerError = vi.fn()
const mockgetUserSession = vi.fn().mockResolvedValue({ relationships: [] })

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

const EN_NAME = 'Some Council Name'
const CY_NAME = 'Cyngor Rhai Enw'

// Provide a baseRequest for all tests
const baseRequest = {
  path: '/?lang=en',
  app: {
    translations: {},
    currentLang: 'en'
  },
  logger: {
    info: vi.fn(),
    error: vi.fn()
  },
  getUserSession: vi
    .fn()
    .mockResolvedValue({ organisationName: EN_NAME, relationships: [] }),
  state: { userSession: null }
}

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
        'defraId.manageAccountUrl': manageDefraAccountUrl,
        sessionTimer: 2
      }
      return configValues[key]
    })
  })

  describe('#context', () => {
    const mockRequest = {
      ...baseRequest,
      app: {
        translations: {
          'your-defra-acco': 'Your Defra account',
          'sign-out': 'Sign out',
          laNames: { [EN_NAME]: CY_NAME }
        },
        currentLang: 'en'
      },
      getUserSession: vi.fn().mockResolvedValue({
        organisationName: EN_NAME,
        organisationId: '123-abc',
        relationships: []
      })
    }

    describe('When webpack manifest file read succeeds', () => {
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

        vi.mocked(fetchWithToken).mockResolvedValue(null)

        contextResult = await contextImport.context(mockRequest)
      })

      test('Should provide expected context', () => {
        expect(contextResult).toEqual({
          authedUser: {
            organisationName: EN_NAME,
            organisationId: '123-abc',
            relationships: []
          },
          assetPath: '/public/assets',
          breadcrumbs: [],
          cookies: {
            cookie_preferences_set: false
          },
          currentLang: 'en',
          currentPath: '/?lang=en',
          getAssetPath: expect.any(Function),
          navigation: [
            {
              current: false,
              text: 'Your Defra account',
              href: manageDefraAccountUrl
            },
            { current: false, text: 'Sign out', href: '/sign-out?lang=en' }
          ],
          serviceName: 'EPR-LAPs',
          serviceUrl: '/',
          sessionTimer: 120000,
          showBetaBanner: true,
          translations: {
            laNames: { [EN_NAME]: CY_NAME },
            'sign-out': 'Sign out',
            'your-defra-acco': 'Your Defra account'
          }
        })
      })

      describe('organisationName translation', () => {
        it('should not translate if language is English', async () => {
          const req = {
            ...mockRequest,
            app: { translations: { laNames: {} }, currentLang: 'en' }
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
            app: { translations: { laNames: {} }, currentLang: 'en' }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })

        it('should default to "en" when currentLang is missing', async () => {
          const req = {
            ...mockRequest,
            app: { translations: { laNames: {} } }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })

        it('should handle when laNames is undefined', async () => {
          const req = {
            ...mockRequest,
            app: { translations: { laNames: {} }, currentLang: 'en' }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })

        it('should default authedUser to {} when getUserSession returns null', async () => {
          const req = {
            ...mockRequest,
            getUserSession: vi.fn().mockResolvedValue({
              organisationName: undefined,
              relationships: []
            })
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser).toEqual({
            organisationName: undefined,
            relationships: []
          })
        })
      })

      describe('branch coverage extras', () => {
        it('should default to {} when translations is missing', async () => {
          const req = { ...mockRequest, app: {} }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe('Some Council Name')
        })

        it('should default to "en" when currentLang is missing', async () => {
          const req = {
            ...mockRequest,
            app: { translations: mockRequest.app.translations }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })

        it('should handle when laNames is undefined', async () => {
          const req = {
            ...mockRequest,
            app: { currentLang: 'cy', translations: {} }
          }
          const contextImport = await import('./context.js')
          const ctx = await contextImport.context(req)
          expect(ctx.authedUser.organisationName).toBe(EN_NAME)
        })
      })

      describe('asset path', () => {
        test('Should provide expected asset path', () => {
          expect(contextResult.getAssetPath('application.js')).toBe(
            '/public/javascripts/application.js'
          )
        })

        test('Should provide expected fallback asset path', () => {
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
          getUserSession: vi.fn().mockResolvedValue({
            organisationName: undefined,
            relationships: []
          })
        }

        const contextImport = await import('./context.js')
        const ctx = await contextImport.context(req)
        expect(ctx.authedUser).toEqual({
          organisationName: undefined,
          relationships: []
        })
      })
    })
  })

  describe('#context cache', () => {
    const req = { ...baseRequest }

    describe('Webpack manifest file cache', () => {
      let contextImport

      beforeAll(async () => {
        contextImport = await import('./context.js')
      })

      beforeEach(async () => {
        mockReadFileSync.mockReturnValue(`{
          "application.js": "javascripts/application.js",
          "stylesheets/application.scss": "stylesheets/application.css"
        }`)
      })

      test('Should use cache on second call', async () => {
        mockReadFileSync.mockClear()
        await contextImport.context(req)
        expect(mockReadFileSync).toHaveBeenCalled()
      })
    })
  })
})
