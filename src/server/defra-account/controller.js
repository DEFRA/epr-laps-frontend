
export const defraAccountController = {
  handler: (request, h) => {
    return h.view('defra-account/index.njk', {
      pageTitle: 'Your DEFRA Account',
      heading: 'Glamshire County Council',
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        },
        {
          text: 'Your DEFRA account'
        }
      ]
    })
  }
}