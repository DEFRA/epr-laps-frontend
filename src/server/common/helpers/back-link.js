// // Combined function: computes backLinkUrl and attaches to view context
// export function getBackLink(server) {
//   server.ext('onPreResponse', (request, h) => {
//     const response = request.response

//     if (response.variety === 'view') {
//       const previousUrl = request.info.referrer || request.yar.get('lastPage')
//       const currentUrl = request.url.href
//       const activeLang = request.query.lang || 'en'

//       // Compute backLinkUrl directly here
//       let backLinkUrl = `/dashboard?lang=${activeLang}`
//       if (previousUrl) {
//         const cleaned = previousUrl.replace(/^https?:\/\/[^/]+/, '')
//         const [path, qs] = cleaned.split('?')
//         const params = new URLSearchParams(qs || '')
//         params.set('lang', activeLang)
//         backLinkUrl = `${path}?${params.toString()}`
//       }

//       // Store current page for next request
//       request.yar.set('lastPage', currentUrl)

//       // Attach backLinkUrl to view context
//       response.source.context = {
//         ...response.source.context,
//         backLinkUrl
//       }
//     }

//     return h.continue
//   })
// }

// export function getBackLink(server) {
//   server.ext('onPreResponse', (request, h) => {
//     const response = request.response;

//     if (response.variety === 'view') {
//       const currentUrl = request.url.href;
//       const activeLang = request.query.lang || 'en';

//       // Get history stack from session
//       let history = request.yar.get('history') || [];

//       // Remove forward history if user navigates to a previous page
//       const existingIndex = history.indexOf(currentUrl);
//       if (existingIndex !== -1) {
//         history = history.slice(0, existingIndex + 1);
//       } else {
//         history.push(currentUrl);
//       }

//       // Limit stack size to 20 to avoid bloating
//       if (history.length > 20) {
//         history.shift();
//       }

//       // Compute backLinkUrl: second-to-last in history
//       let backLinkUrl = `/dashboard?lang=${activeLang}`; // default
//       if (history.length >= 2) {
//         const previousUrl = history[history.length - 2];
//         const cleaned = previousUrl.replace(/^https?:\/\/[^/]+/, '');
//         const [path, qs] = cleaned.split('?');
//         const params = new URLSearchParams(qs || '');
//         params.set('lang', activeLang);
//         backLinkUrl = `${path}?${params.toString()}`;
//       }

//       // Save updated history back to session
//       request.yar.set('history', history);

//       // Attach backLinkUrl to view context
//       response.source.context = {
//         ...response.source.context,
//         backLinkUrl
//       };
//     }

//     return h.continue;
//   });
// }

// export function getBackLink(server) {
//   server.ext('onPreResponse', (request, h) => {
//     const response = request.response;

//     if (response.variety === 'view') {
//       const currentUrl = request.url.href;
//       const activeLang = request.query.lang || 'en';

//       // Get history stack from session
//       let history = request.yar.get('history') || [];

//       // --- Minimal change for cookie page: treat it like normal page ---
//       // Simply allow it to be pushed to history, nothing else.
//       const existingIndex = history.indexOf(currentUrl);
//       if (existingIndex !== -1) {
//         history = history.slice(0, existingIndex + 1);
//       } else {
//         history.push(currentUrl);
//       }

//       // Limit stack size
//       if (history.length > 20) history.shift();

//       // Save updated history
//       request.yar.set('history', history);

//       // Compute backLinkUrl exactly as your original logic
//       let backLinkUrl = `/dashboard?lang=${activeLang}`;
//       if (history.length >= 2) {
//         const previousUrl = history[history.length - 2];
//         const cleaned = previousUrl.replace(/^https?:\/\/[^/]+/, '');
//         const [path, qs] = cleaned.split('?');
//         const params = new URLSearchParams(qs || '');
//         params.set('lang', activeLang);
//         backLinkUrl = `${path}?${params.toString()}`;
//       }

//       // Attach backLinkUrl to view context
//       response.source.context = {
//         ...response.source.context,
//         backLinkUrl
//       };
//     }

//     return h.continue;
//   });
// }

// export function getBackLink(server) {
//   server.ext('onPreResponse', (request, h) => {
//     const response = request.response;

//     if (response.variety === 'view') {
//       const currentUrl = request.url.href;
//       const currentPath = request.url.pathname;
//       const currentLang = request.query.lang || 'en';

//       // Get history stack from session
//       let history = request.yar.get('history') || [];

//       // Push to history only if pathname changes (ignore lang toggles)
//       const lastUrl = history.length ? history[history.length - 1] : null;
//       let pushToHistory = true;
//       if (lastUrl) {
//         const lastPath = new URL(lastUrl, `http://${request.info.host}`).pathname;
//         if (lastPath === currentPath) {
//           pushToHistory = false; // same page, only lang changed
//         }
//       }

//       if (pushToHistory) {
//         const existingIndex = history.indexOf(currentUrl);
//         if (existingIndex !== -1) {
//           history = history.slice(0, existingIndex + 1);
//         } else {
//           history.push(currentUrl);
//         }
//         if (history.length > 20) history.shift();
//         request.yar.set('history', history);
//       }

//       // Compute backLinkUrl
//       let backLinkUrl = `/?lang=${currentLang}`; // default
//       if (history.length >= 2) {
//         const previousUrl = history[history.length - 2]; // actual previous page
//         const urlObj = new URL(previousUrl, `http://${request.info.host}`);

//         // Replace lang with current language
//         urlObj.searchParams.set('lang', currentLang);

//         backLinkUrl = urlObj.pathname + '?' + urlObj.searchParams.toString();
//       }

//       // Attach to view context
//       response.source.context = {
//         ...response.source.context,
//         backLinkUrl
//       };
//     }

//     return h.continue;
//   });
// }

// export function getBackLink(server) {
//   server.ext('onPreResponse', (request, h) => {
//     const response = request.response;

//     if (response.variety === 'view') {
//       const currentPath = request.url.pathname;
//       const currentLang = request.query.lang || 'en';

//       // Get history stack (only pathnames)
//       let history = request.yar.get('history') || [];

//       // Push current page only if pathname changes (ignore lang toggles)
//       const lastPath = history.length ? history[history.length - 1] : null;
//       if (lastPath !== currentPath) {
//         history.push(currentPath);
//         if (history.length > 20) history.shift();
//         request.yar.set('history', history);
//       }

//       // Compute backLinkUrl
//       let backLinkUrl = `/?lang=${currentLang}`; // default
//       if (history.length >= 2) {
//         const previousPath = history[history.length - 2]; // actual previous page
//         backLinkUrl = `${previousPath}?lang=${currentLang}`; // apply current language
//       }

//       // Attach backLinkUrl to view context
//       response.source.context = {
//         ...response.source.context,
//         backLinkUrl
//       };
//     }

//     return h.continue;
//   });
// }

export function getBackLink(server) {
  server.ext('onPreResponse', (request, h) => {
    const response = request.response

    if (response.variety === 'view') {
      // If for some reason href is missing, fallback to pathname
      const currentUrl = request.url.href || request.url.pathname
      const currentLang = request.query.lang || 'en'

      // Remove domain + strip lang → used for comparison only
      const stripForKey = (url) => {
        if (!url) return '' // safety

        const noDomain = url.replace(/^https?:\/\/[^/]+/, '')
        const [path, qs] = noDomain.split('?')

        const params = new URLSearchParams(qs || '')
        params.delete('lang')

        const cleaned = params.toString()
        return cleaned ? `${path}?${cleaned}` : path
      }

      const currentKey = stripForKey(currentUrl)

      // Get history
      let history = request.yar.get('history') || []

      // Find if this page (ignoring lang) already exists
      const existingIndex = history.findIndex((h) => h.key === currentKey)

      if (existingIndex !== -1) {
        history = history.slice(0, existingIndex + 1)
      } else {
        history.push({
          key: currentKey,
          full: currentUrl // full URL ALWAYS stored
        })
      }

      // Limit size
      if (history.length > 20) history.shift()

      request.yar.set('history', history)

      // Default backlink
      let backLinkUrl = `/?lang=${currentLang}`

      if (history.length >= 2) {
        const prev = history[history.length - 2]

        if (prev && prev.full) {
          const cleanedPrev = prev.full.replace(/^https?:\/\/[^/]+/, '')
          const [path, qs] = cleanedPrev.split('?')

          const params = new URLSearchParams(qs || '')
          params.set('lang', currentLang)

          const qsOut = params.toString()
          backLinkUrl = qsOut
            ? `${path}?${qsOut}`
            : `${path}?lang=${currentLang}`
        }
      }

      // Inject into view context
      response.source.context = {
        ...response.source.context,
        backLinkUrl
      }
    }

    return h.continue
  })
}
