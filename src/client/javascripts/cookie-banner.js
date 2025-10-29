/* eslint-env browser */
/* global HTMLElement, HTMLButtonElement */
import * as CookieFunctions from './cookie-functions.js'

const cookieBannerAcceptSelector = '.js-cookie-banner-accept'
const cookieBannerRejectSelector = '.js-cookie-banner-reject'
const cookieBannerHideButtonSelector = '.js-cookie-banner-hide'
const cookieMessageSelector = '.js-cookie-banner-message'
const cookieConfirmationAcceptSelector = '.js-cookie-banner-confirmation-accept'
const cookieConfirmationRejectSelector = '.js-cookie-banner-confirmation-reject'

class CookieBanner {
  constructor($module) {
    if (!this.shouldInitialize($module)) {
      return this
    }

    this.$cookieBanner = $module
    this.cacheElements($module)

    if (!this.areElementsValid()) {
      return this
    }

    this.initializeBanner()
    this.bindEvents()
  }

  shouldInitialize($module) {
    return (
      $module instanceof HTMLElement &&
      document.body.classList.contains('govuk-frontend-supported') &&
      !this.onCookiesPage()
    )
  }

  cacheElements($module) {
    this.$acceptButton = $module.querySelector(cookieBannerAcceptSelector)
    this.$rejectButton = $module.querySelector(cookieBannerRejectSelector)
    this.$cookieMessage = $module.querySelector(cookieMessageSelector)
    this.$cookieConfirmationAccept = $module.querySelector(
      cookieConfirmationAcceptSelector
    )
    this.$cookieConfirmationReject = $module.querySelector(
      cookieConfirmationRejectSelector
    )
    this.$cookieBannerHideButtons = $module.querySelectorAll(
      cookieBannerHideButtonSelector
    )
  }

  areElementsValid() {
    return (
      this.$acceptButton instanceof HTMLButtonElement &&
      this.$rejectButton instanceof HTMLButtonElement &&
      this.$cookieMessage instanceof HTMLElement &&
      this.$cookieConfirmationAccept instanceof HTMLElement &&
      this.$cookieConfirmationReject instanceof HTMLElement &&
      this.$cookieBannerHideButtons.length > 0
    )
  }

  initializeBanner() {
    const currentConsentCookie = CookieFunctions.getConsentCookie()
    if (!currentConsentCookie) {
      CookieFunctions.resetCookies()
      this.$cookieBanner.removeAttribute('hidden')
    }
  }

  bindEvents() {
    this.$acceptButton.addEventListener('click', () => this.acceptCookies())
    this.$rejectButton.addEventListener('click', () => this.rejectCookies())
    this.$cookieBannerHideButtons.forEach((btn) =>
      btn.addEventListener('click', () => this.hideBanner())
    )
  }

  hideBanner() {
    this.$cookieBanner.setAttribute('hidden', 'true')
  }

  acceptCookies() {
    CookieFunctions.setConsentCookie({ analytics: true })
    this.$cookieMessage.setAttribute('hidden', 'true')
    this.revealConfirmationMessage(this.$cookieConfirmationAccept)
  }

  rejectCookies() {
    CookieFunctions.setConsentCookie({ analytics: false })
    this.$cookieMessage.setAttribute('hidden', 'true')
    this.revealConfirmationMessage(this.$cookieConfirmationReject)
  }

  rejectCookies_cookiepage() {
    CookieFunctions.setConsentCookie({ analytics: false })
    this.$cookieMessage.setAttribute('hidden', 'true')
    // this.revealConfirmationMessage(this.$cookieConfirmationReject)
  }

  acceptCookies_cookiepage() {
    CookieFunctions.setConsentCookie({ analytics: true })
    this.$cookieMessage.setAttribute('hidden', 'true')
    // this.revealConfirmationMessage(this.$cookieConfirmationAccept)
  }

  revealConfirmationMessage(confirmationMessage) {
    confirmationMessage.removeAttribute('hidden')
    if (!confirmationMessage.getAttribute('tabindex')) {
      confirmationMessage.setAttribute('tabindex', '-1')
      confirmationMessage.addEventListener('blur', () => {
        confirmationMessage.removeAttribute('tabindex')
      })
    }
    confirmationMessage.focus()
  }

  onCookiesPage() {
    return window.location.pathname === '/cookies/'
  }
}

export default CookieBanner
