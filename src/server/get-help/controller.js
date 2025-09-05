/**
 * A GDS styled example get help controller
 */

export const getHelpController = {
  handler: (_request, h) => {
    return h.view('get-help/index.njk', {
      pageTitle: 'Get Help',
      heading: 'Glamshire County Council',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        },
        {
          text: 'Get help'
        }
      ]
    })
  }
}
