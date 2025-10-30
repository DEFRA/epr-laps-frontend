const cookiesController = {
  handler: (_request, h) => {
    return h.view('cookies/index.njk', {})
  }
}
export { cookiesController }
