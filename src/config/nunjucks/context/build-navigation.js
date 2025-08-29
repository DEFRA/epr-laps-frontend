export function buildNavigation(request) {
  return [
    {
      text: 'Your Defra account',
      href: '/',
      current: request?.path === '/'
    },
    {
      text: 'Sign out',
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
