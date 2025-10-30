import {
  createAll,
  Button,
  Checkboxes,
  ErrorSummary,
  Header,
  Radios,
  SkipLink,
  ServiceNavigation
} from 'govuk-frontend'
// import CookieBanner from './cookie-banner.js'
// import {
//   getConsentCookie,
//   isValidConsentCookie,
//   removeUACookies
// } from './cookie-functions.js'
// import CookiesPage from './cookies-page.js'

// Initialise GOV.UK Frontend components after the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  createAll(Button)
  createAll(Checkboxes)
  createAll(ErrorSummary)
  createAll(Header)
  createAll(Radios)
  createAll(SkipLink)
  createAll(ServiceNavigation)

  // ----- Cookie banner -----
  // const $cookieBanner = document.querySelector(
  //   '[data-module="govuk-cookie-banner"]'
  // )
  // if ($cookieBanner) {
  //   const cookieBanner = new CookieBanner($cookieBanner)
  //   if (typeof cookieBanner.init === 'function') {
  //     cookieBanner.init()
  //   }
  // }

  // // ----- Analytics consent -----
  // const userConsent = getConsentCookie()
  // if (
  //   userConsent &&
  //   isValidConsentCookie(userConsent) &&
  //   userConsent.analytics
  // ) {
  //   // Initialise analytics here (e.g., GA4 or GTM)
  //   removeUACookies()
  // }

  // // ----- Cookies page -----
  // const $cookiesPage = document.querySelector(
  //   '[data-module="app-cookies-page"]'
  // )
  // if ($cookiesPage) {
  //   const cookiesPage = new CookiesPage($cookiesPage)
  //   if (typeof cookiesPage.init === 'function') {
  //     cookiesPage.init()
  //   }
  // }
})
