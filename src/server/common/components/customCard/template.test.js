import { renderComponent } from '../../test-helpers/component-helpers.js'

describe('Custom Card Component', () => {
  let $customCard

  describe('With body text', () => {
    beforeEach(() => {
      $customCard = renderComponent('customCard', {
        title: 'Services',
        body: 'A page showing available services'
      })
    })

    test('Should render the app customCard component wrapper', () => {
      expect($customCard('[data-testid="app-custom-card"]')).toHaveLength(1)
    })

    test('Should render the title text', () => {
      expect(
        $customCard('[data-testid="app-customCard-title"]').text().trim()
      ).toBe('Services')
    })

    test('Should render the body text', () => {
      expect($customCard('.govuk-body').text().trim()).toBe(
        'A page showing available services'
      )
    })
  })

  describe('With link', () => {
    beforeEach(() => {
      $customCard = renderComponent('customCard', {
        title: 'Services',
        link: '/services'
      })
    })

    test('Should render the title as a link when link param is passed', () => {
      const link = $customCard('[data-testid="app-customCard-title"] a')
      expect(link).toHaveLength(1)
      expect(link.text().trim()).toBe('Services')
      expect(link.attr('href')).toBe('/services')
    })
  })

  describe('With list items', () => {
    beforeEach(() => {
      $customCard = renderComponent('customCard', {
        title: 'Available Services',
        list: ['Service A', 'Service B', 'Service C']
      })
    })

    test('Should render all list items correctly', () => {
      const items = $customCard('ul.govuk-list li')
      expect(items).toHaveLength(3)
      expect(items.eq(0).text().trim()).toBe('Service A')
      expect(items.eq(1).text().trim()).toBe('Service B')
      expect(items.eq(2).text().trim()).toBe('Service C')
    })
  })

  describe('Without optional params', () => {
    beforeEach(() => {
      $customCard = renderComponent('customCard', {
        title: 'Fallback Card'
      })
    })

    test('Should still render the card with only title', () => {
      expect(
        $customCard('[data-testid="app-customCard-title"]').text().trim()
      ).toBe('Fallback Card')
    })

    test('Should not render body text if not provided', () => {
      expect($customCard('.govuk-body').text().trim()).toBe('')
    })

    test('Should not render list if not provided', () => {
      expect($customCard('ul.govuk-list li')).toHaveLength(0)
    })
  })
})
