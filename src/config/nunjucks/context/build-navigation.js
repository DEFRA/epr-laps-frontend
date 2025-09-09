export function buildNavigation(request) {
    const translations = request?.app?.translations || {}
  return [
    {
      text: translations['your-defra-acco'] || 'Your Defra account',
      href: '/defra-account',
      current: request?.path === '/your-defra-account'
    },
    {
      text: translations['sign-out'] || 'Sign out',
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
