import { buildNavigation } from './build-navigation.js'

function mockRequest(options) {
return {
    ...options,
    app: { translations: {} }
}
}

describe('#buildNavigation', () => {
  test('Should provide expected navigation details', () => {
    expect(
      buildNavigation(mockRequest({ path: '/non-existent-path' }))
    ).toEqual([
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
    ])
  })

  test('Should provide expected highlighted navigation details', () => {
    expect(buildNavigation(mockRequest({ path: '/' }))).toEqual([
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
    ])
  })
})
