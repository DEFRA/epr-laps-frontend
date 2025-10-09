/**
 * A GDS styled example get Payment documents controller
 */

export const serviceUnavailableController = {
  handler: (_request, h) => {
    return h.view('service-is-unavailable/index.njk', {
      pageTitle: 'Service is unavailable'
    })
  }
}
