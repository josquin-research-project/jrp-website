// Shared by JRP and The 1520s Project. Keep both copies in sync.
function createAssetDelivery(base, index, servers) {
  base = base.replace(/\/$/, '') + '/';
  const reverse = {};
  for (const [source, key] of Object.entries(index.sources)) {
    (reverse[key] ||= []).push(source);
  }
  function candidates(source) {
    if (!source || source === '#unavailable-score') return [];
    source = source.replace(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/(?:tree|blob)\//, 'https://raw.githubusercontent.com/$1/');
    let key = index.sources[source];
    if (source.startsWith(base)) key = source.slice(base.length);
    for (const server of servers) {
      if (source.startsWith(server)) key = 'mirror-assets/' + source.slice(server.length);
    }
    const urls = key ? [base + key] : [];
    if (key?.startsWith('mirror-assets/')) {
      urls.push(...servers.map(server => server + key.slice(14)));
    }
    if (key) urls.push(...(reverse[key] || []));
    urls.push(source);
    return [...new Set(urls)].filter(url => !index.blocked.includes(url));
  }
  function preferred(url) { return candidates(url)[0] || '#unavailable-score'; }
  async function request(url, options = {}) {
    let lastError;
    for (const candidate of candidates(url)) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);
      const abort = () => controller.abort();
      if (options.signal?.aborted) { clearTimeout(timer); throw new Error('Request aborted'); }
      options.signal?.addEventListener('abort', abort, {once:true});
      try {
        const response = await fetch(candidate, {...options, signal:controller.signal});
        if (!response.ok || /text\/html/i.test(response.headers.get('content-type') || '')) {
          throw new Error('Invalid asset response: ' + response.status);
        }
        // Read the body inside the timeout, so a stalled download also falls back.
        const body = options.method === 'HEAD' ? null : await response.arrayBuffer();
        const result = new Response(body, {status:response.status, headers:response.headers});
        Object.defineProperty(result, 'url', {value:candidate});
        return result;
      } catch (error) {
        lastError = error;
        if (options.signal?.aborted) throw error;
      } finally {
        clearTimeout(timer);
        options.signal?.removeEventListener('abort', abort);
      }
    }
    throw lastError || new Error('Asset unavailable');
  }
  function media(element, url) {
    const urls = candidates(url);
    let position = 0;
    element.onerror = () => {
      if (++position >= urls.length) return;
      const resume = !element.paused;
      element.src = urls[position];
      element.load?.();
      if (resume && element.play) element.play().catch(() => {});
    };
    element.src = urls[0] || '';
  }
  return {base, index, candidates, preferred, fetch:request, media};
}
