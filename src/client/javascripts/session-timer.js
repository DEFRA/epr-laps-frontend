let sessionTimer
const timerDuration = 30 * 60 * 1000 // 30 minutes

function startSessionTimer() {
  if (sessionTimer) {
    clearTimeout(sessionTimer)
  }

  // Start the session timer
  sessionTimer = setTimeout(() => {
    document.location.href = '/timed-out'
  }, timerDuration)
}

function restartSessionTimer() {
  // Clear the existing timer and start a new one
  clearTimeout(sessionTimer)
  startSessionTimer()
}

function setupActivityListeners() {
  // Listen for various user activities
  const events = [
    'keypress',
    'click',
    'scroll',
    'touchstart',
    'mousedown',
    'mousemove'
  ]
  events.forEach((eventType) => {
    document.addEventListener(eventType, restartSessionTimer, { passive: true })
  })
}

startSessionTimer()
setupActivityListeners()
