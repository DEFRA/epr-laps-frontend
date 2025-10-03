import { renderComponent } from '../../test-helpers/component-helpers.js'

describe('App Loader Component', () => {
  let $loader

  describe('With default options', () => {
    beforeEach(() => {
      $loader = renderComponent('loader', {})
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

    test('Should match snapshot', () => {
      const $el = $loader('[data-testid="app-loader"]')
      expect($el.html()).toMatchSnapshot()
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

  describe('With empty classes prop', () => {
    beforeEach(() => {
      $loader = renderComponent('loader', { classes: '' })
    })

    test('Should render default class only', () => {
      const $el = $loader('[data-testid="app-loader"]')
      expect($el.hasClass('app-loader')).toBe(true)
      expect($el.attr('class')).toBe('app-loader')
    })
  })

  describe('With invalid props', () => {
    beforeEach(() => {
      $loader = renderComponent('loader', { classes: null, name: 123 })
    })

    test('Should render default class', () => {
      const $el = $loader('[data-testid="app-loader"]')
      expect($el.hasClass('app-loader')).toBe(true)
    })

    test('Should render data-js as string', () => {
      const $el = $loader('[data-testid="app-loader"]')
      expect($el.attr('data-js')).toBe('123')
    })
  })

  test('Should render multiple loaders with different names', () => {
    const $loader1 = renderComponent('loader', { name: 'loader1' })
    const $loader2 = renderComponent('loader', {
      name: 'loader2',
      classes: 'extra'
    })

    expect($loader1('[data-testid="app-loader"]').attr('data-js')).toBe(
      'loader1'
    )
    expect($loader2('[data-testid="app-loader"]').attr('data-js')).toBe(
      'loader2'
    )
    expect($loader2('[data-testid="app-loader"]').hasClass('extra')).toBe(true)
  })
})
