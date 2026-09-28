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

// Verification belongs to the form, before the visitor submits a search.
let jrpFormWidget, jrpFormToken = '', jrpFormApi;
async function initializeJrpSearchVerification() {
  const holder = document.getElementById('search-verification');
  if (!holder || jrpFormWidget !== undefined) return;
  const status = document.getElementById('search-verification-status');
  try {
    jrpFormApi = await loadJrpTurnstile();
    jrpFormWidget = jrpFormApi.render(holder, {
      sitekey: JRP_SEARCH_SITEKEY, action: 'jrp-search',
      appearance: 'always', size: 'flexible', 'response-field': false,
      callback: token => { jrpFormToken = token; status.textContent = ''; },
      'expired-callback': () => { jrpFormToken = ''; status.textContent = 'Verification expired. Please verify again.'; },
      'error-callback': () => { jrpFormToken = ''; status.textContent = 'Verification failed. Please reload to try again.'; return true; }
    });
  } catch (error) { status.textContent = error.message; }
}
function takeJrpSearchToken() {
  if (!jrpFormToken) {
    document.getElementById('search-verification-status').textContent = 'Please complete verification before searching.';
    return '';
  }
  const token = jrpFormToken;
  jrpFormToken = '';
  return token;
}
function resetJrpSearchVerification() {
  jrpFormToken = '';
  if (jrpFormApi && jrpFormWidget !== undefined) jrpFormApi.reset(jrpFormWidget);
}
function storeJrpSearchToken(token) {
  sessionStorage.setItem('jrp-search-verification', JSON.stringify({token, time: Date.now()}));
}
function consumeJrpSearchToken() {
  const raw = sessionStorage.getItem('jrp-search-verification');
  sessionStorage.removeItem('jrp-search-verification');
  try {
    const value = JSON.parse(raw);
    return value && Date.now() - value.time < 240000 ? value.token : '';
  } catch (_) { return ''; }
}
document.addEventListener('DOMContentLoaded', () => {
  const holder = document.getElementById('search-verification');
  if (!holder) return;
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      observer.disconnect();
      initializeJrpSearchVerification();
    }
  });
  observer.observe(holder);
});
async function requestJrpSearch(params, token) {
  if (!token) throw new Error('Please return to the search form and complete verification.');
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
}

// Signed PDF links are returned only after a verified search.
function highlightedSearchPdfLink(entry) {
  if (!entry || typeof entry.highlightPdf !== 'string') return '';
  const api = new URL(JRP_SEARCH_API);
  const url = new URL(entry.highlightPdf, api);
  if (url.origin !== api.origin || url.pathname !== '/api/highlight-pdf' || !url.searchParams.get('ticket')) return '';
  return '<a target="_blank" rel="noopener noreferrer" href="' + url.href.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + '">Highlighted PDF</a>';
}
