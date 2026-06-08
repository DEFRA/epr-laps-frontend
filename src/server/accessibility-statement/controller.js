/**
 * A GDS styled example accessibility statement controller
 */

export const accessibilityController = {
  handler: (request, h) => {
    const { currentLang, translations } = request.app

    return h.view('accessibility-statement/index.njk', {
      pageTitle: 'Accessibility Statement',
      currentLang,
      translations,
      breadcrumbs: [
        {
          text: translations['laps-home'],
          href: `/?lang=${currentLang}`
        },
        {
          text: translations['accessibility-statement'],
          href: `/accessibility-statement?lang=${currentLang}`
        }
      ]
    })
  }
}
