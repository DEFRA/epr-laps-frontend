import { describe, test, expect, vi } from 'vitest'
import { accessibilityController } from './controller.js'

describe('#accessibilityController', () => {
  test('should render the accessibility statement page with correct view data', () => {
    const request = {
      app: {
        currentLang: 'en',
        'get-help': 'Get Help',
        translations: {
          'laps-home': 'LAPS Home',
          'accessibility-statement': 'Accessibility Statement'
        }
      }
    }

    const h = {
      view: vi.fn()
    }

    accessibilityController.handler(request, h)

    expect(h.view).toHaveBeenCalledTimes(1)

    expect(h.view).toHaveBeenCalledWith('accessibility-statement/index.njk', {
      pageTitle: 'Accessibility Statement',
      currentLang: 'en',
      getHelpUrl: 'https://google.com',
      translations: {
        'laps-home': 'LAPS Home',
        'accessibility-statement': 'Accessibility Statement'
      },
      breadcrumbs: [
        {
          text: 'LAPS Home',
          href: '/?lang=en'
        },
        {
          text: 'Accessibility Statement',
          href: '/accessibility-statement?lang=en'
        }
      ]
    })
  })

  test('should return the result from h.view', () => {
    const request = {
      app: {
        currentLang: 'cy',
        translations: {
          'laps-home': 'Cartref LAPS',
          'accessibility-statement': 'Datganiad Hygyrchedd'
        }
      }
    }

    const viewResponse = Symbol('view response')

    const h = {
      view: vi.fn().mockReturnValue(viewResponse)
    }

    const result = accessibilityController.handler(request, h)

    expect(result).toBe(viewResponse)

    expect(h.view).toHaveBeenCalledWith(
      'accessibility-statement/index.njk',
      expect.objectContaining({
        pageTitle: 'Accessibility Statement',
        currentLang: 'cy',
        translations: request.app.translations,
        breadcrumbs: [
          {
            text: 'Cartref LAPS',
            href: '/?lang=cy'
          },
          {
            text: 'Datganiad Hygyrchedd',
            href: '/accessibility-statement?lang=cy'
          }
        ]
      })
    )
  })
})
