export const noServiceRoleController = {
  handler: (_request, h) => {
    return h.view('no-service-role/index.njk', {
      pageTitle: 'No Service Role'
    })
  }
}
