export const noServiceRoleController = {
  handler: (_request, h) => {
    return h.view('no-service-role/index.njk', {
      pageTitle: 'Your DEFRA Account',
      heading: 'Glamshire County Council'
      //   breadcrumbs: [
      //     {
      //       text: 'Local Authority Payments (LAPs) home',
      //       href: '/'
      //     },
      //     {
      //       text: 'Your DEFRA account'
      //     }
      //   ]
    })
  }
}
