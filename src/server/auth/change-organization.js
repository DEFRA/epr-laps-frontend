export const changeOrganizationController = {
  method: 'GET',
  path: '/change-organisation',
  options: {
    auth: 'defra-id'
  },
  handler: async (request, h) => {
    request.yar.flash('referrer', '/')
    return h.redirect('/')
  }
}
