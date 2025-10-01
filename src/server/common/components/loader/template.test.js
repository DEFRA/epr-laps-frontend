import { renderComponent } from '../../test-helpers/component-helpers.js'

describe('App Loader Component', () => {
  let $loader

  describe('With default options', () => {
    beforeEach(() => {
      $loader = renderComponent('loader', {}) // no name
    })

    test('Should render app loader component', () => {
      expect($loader('[data-testid="app-loader"]')).toHaveLength(1)
    })

    test('Should have default class', () => {
      expect($loader('[data-testid="app-loader"]').hasClass('app-loader')).toBe(
        true
      )
    })

    test('Should not have data-js attribute', () => {
      expect($loader('[data-testid="app-loader"]').attr('data-js')).toBe(
        undefined
      )
    })
  })

  describe('With extra classes and name', () => {
    beforeEach(() => {
      $loader = renderComponent('loader', {
        classes: 'extra-class another-class',
        name: 'loader1'
      })
    })

    test('Should render with additional classes', () => {
      const $el = $loader('[data-testid="app-loader"]')
      expect($el.hasClass('app-loader')).toBe(true)
      expect($el.hasClass('extra-class')).toBe(true)
      expect($el.hasClass('another-class')).toBe(true)
    })

    test('Should render data-js attribute', () => {
      expect($loader('[data-testid="app-loader"]').attr('data-js')).toBe(
        'loader1'
      )
    })
  })
})
