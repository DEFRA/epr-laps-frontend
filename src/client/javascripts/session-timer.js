class SessionTimer {
  constructor(options = {}) {
    this.timerDuration = options.timerDuration || window.inactivityTimeout
    this.redirectUrl = options.redirectUrl || '/timed-out'
    this.sessionTimer = null
    this.activityEvents = options.activityEvents || [
      'keypress',
      'click',
      'scroll',
      'touchstart',
      'mousedown',
      'mousemove'
    ]

    this.restartSessionTimer = this.restartSessionTimer.bind(this)
  }

  startSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer)
    }

    // Start the session timer
    this.sessionTimer = setTimeout(() => {
      document.location.href = this.redirectUrl
    }, this.timerDuration)
  }

  restartSessionTimer() {
    // Clear the existing timer and start a new one
    clearTimeout(this.sessionTimer)
    this.startSessionTimer()
  }

  setupActivityListeners() {
    // Listen for various user activities
    this.activityEvents.forEach((eventType) => {
      document.addEventListener(eventType, this.restartSessionTimer, {
        passive: true
      })
    })
  }
}

// Create and start the session timer instance
const sessionTimer = new SessionTimer()
sessionTimer.startSessionTimer()
sessionTimer.setupActivityListeners()
