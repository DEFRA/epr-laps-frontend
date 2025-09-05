export const signOutController = {
  handler: (request, h) => {
    return h.view('sign-out/index.njk', {
      pageTitle: 'Sign out',
      heading: 'Glamshire County Council'
    })
  }
}
