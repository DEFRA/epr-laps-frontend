export function buildNavigation(request) {
  return [
    {
      text: 'Your Defra account',
      href: '/',
      current: request?.path === '/your-defra-account'
    },
    {
      text: 'Sign out',
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
