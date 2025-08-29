/**
 * A GDS styled example home page controller.
 * Provided as an example, remove or modify as required.
 */
export const homeController = {
  handler: (_request, h) => {
    const translations = _request.app.translations || {};
    const currentLang = _request.app.currentLang || 'en';

    return h.view('home/index', {
      pageTitle: 'Home',
      heading: translations['local-authority'] || 'local-authority',
      currentLang,
      breadcrumbs: [
        {
          text: 'Local Authority Payments (LAPs) home',
          href: '/'
        }
      ]
    });
  }
};


