// Load Turnstile only when a musical search actually runs.
let jrpTurnstileLoad;
function loadJrpTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!jrpTurnstileLoad) {
    jrpTurnstileLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const timer = setTimeout(() => fail(), 20000);
      function fail() {
        clearTimeout(timer);
        script.remove();
        jrpTurnstileLoad = null;
        reject(new Error('Verification could not load. Please try again.'));
      }
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.onload = () => { clearTimeout(timer); resolve(window.turnstile); };
      script.onerror = fail;
      document.head.appendChild(script);
    });
  }
  return jrpTurnstileLoad;
}

async function requestJrpSearch(params, container, onVerified) {
  if (!JRP_SEARCH_SITEKEY) throw new Error('Search verification is temporarily unavailable.');
  const api = await loadJrpTurnstile();
  const holder = document.createElement('div');
  container.appendChild(holder);
  let widget;
  try {
    const token = await new Promise((resolve, reject) => {
      let settled = false;
      const finish = (error, value) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        error ? reject(new Error(error)) : resolve(value);
      };
      const timer = setTimeout(() => finish('Verification timed out. Please try again.'), 120000);
      try {
        widget = api.render(holder, {
          sitekey: JRP_SEARCH_SITEKEY, action: 'jrp-search',
          execution: 'execute', appearance: 'interaction-only', size: 'flexible',
          'response-field': false, retry: 'never',
          callback: value => finish(null, value),
          'error-callback': () => { finish('Verification failed. Please try again.'); return true; },
          'expired-callback': () => finish('Verification expired. Please try again.'),
          'timeout-callback': () => finish('Verification timed out. Please try again.')
        });
        api.execute(widget);
      } catch (error) { finish('Verification could not start. Please try again.'); }
    });
    if (onVerified) onVerified();
    const body = new URLSearchParams(params);
    body.set('cf-turnstile-response', token);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 125000);
    try {
      const response = await fetch(JRP_SEARCH_API, {
        method: 'POST', body, signal: controller.signal, cache: 'no-store', credentials: 'omit'
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Search is temporarily unavailable.');
      return result;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Search took too long. Please narrow the query.');
      throw error;
    } finally { clearTimeout(timer); }
  } finally {
    if (widget !== undefined) api.remove(widget);
    holder.remove();
  }
}
