export const serviceProblemController = {
  handler: (request, h) => {
    const translations = request.app?.translations || {}

    return h.view('error/index', {
      pageTitle: translations['service-problem'],
      heading: translations['service-problem'],
      message: translations['try-again']
    })
  }
}
