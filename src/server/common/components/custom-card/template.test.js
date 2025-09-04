import { renderComponent } from '../../test-helpers/component-helpers.js'

describe.skip('Custom Card Component', () => {
  let $customCard

  describe('With caption', () => {
    beforeEach(() => {
      $customCard = renderComponent('customCard', {
        title: 'Services',
        caption: 'A page showing available services'
      })
    })

    test('Should render app customCard component', () => {
      expect($customCard('[data-testid="app-custom-card"]')).toHaveLength(1)
    })

    test('Should contain expected customCard', () => {
      expect(
        $customCard('[data-testid="app-customCard-title"]').text().trim()
      ).toBe('Services')
    })

    test('Should have expected customCard caption', () => {
      expect(
        $customCard('[data-testid="app-customCard-caption"]').text().trim()
      ).toBe('A page showing available services')
    })
  })
})
