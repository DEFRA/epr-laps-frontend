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
        'sign-out': 'Sign out'
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
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
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
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
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
    ])
  })
})
