import { buildNavigation } from './build-navigation.js'
import { config } from '../../config.js'

const manageDefraAccountUrl =
  'https://your-account.cpdev.cui.defra.gov.uk/management'

function mockRequest(options) {
  return {
    ...options,
    app: {
      translations: {
        'your-defra-acco': 'Your Defra account',
        'sign-out': 'Sign out',
        'change-orga': 'Change organisation'
      }
    }
  }
}

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

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', async () => {
    expect(
      await buildNavigation(
        mockRequest({
          path: '/non-existent-path',
          getUserSession: vi.fn().mockResolvedValue({
            relationships: []
          })
        })
      )
    ).toEqual([
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
    ])
  })

  test('Should provide expected highlighted navigation details', async () => {
    const navigation = await buildNavigation(
      mockRequest({
        path: '/',
        getUserSession: vi.fn().mockResolvedValue({
          relationships: []
        })
      })
    )
    expect(navigation).toEqual([
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
    ])
  })

  test('Should provide expected navigation details when user has multiple organisations', async () => {
    const mockedRequest = mockRequest({
      getUserSession: vi.fn().mockResolvedValue({
        relationships: [
          '777:222:Test:0:employee:0,333:456:test-organization:0:employee:0',
          '888:333:Another Test:0:employee:0,444:567:another-organization:0:employee:0'
        ]
      })
    })
    const navigation = await buildNavigation(mockedRequest)
    expect(navigation).toEqual([
      {
        current: false,
        href: 'https://your-account.cpdev.cui.defra.gov.uk/management',
        text: 'Your Defra account'
      },
      {
        current: false,
        href: '/defra-account/change-organisation',
        text: 'Change organisation'
      },
      {
        current: false,
        href: '/sign-out?lang=en',
        text: 'Sign out'
      }
    ])
  })

  test('Should default to provided query.lang when set', async () => {
    const navigation = await buildNavigation(
      mockRequest({
        path: '/dashboard',
        query: { lang: 'cy' }, // simulate Welsh language
        getUserSession: vi.fn().mockResolvedValue({
          relationships: []
        })
      })
    )

    expect(navigation).toEqual([
      {
        current: false,
        text: 'Your Defra account',
        href: manageDefraAccountUrl
      },
      {
        current: false,
        text: 'Sign out',
        href: '/sign-out?lang=cy'
      }
    ])
  })

  test('Should return empty array when path is /sign-out', async () => {
    const navigation = await buildNavigation(
      mockRequest({
        path: '/logout',
        getUserSession: vi.fn().mockResolvedValue({
          relationships: []
        })
      })
    )

    expect(navigation).toEqual([])
  })
})
