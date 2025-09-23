export function buildNavigation(request) {
  const translations = request?.app?.translations || {}
  return [
    {
      text: translations['your-defra-acco'],
      href: '/defra-account',
      current: request?.path === '/defra-account'
    },
    {
      text: translations['sign-out'],
      href: '/sign-out',
      current: request?.path === '/sign-out'
    }
  ]
}
