// Match the websites' R2 routing while retaining publication holds.
export function assetCandidates(source, {base, index, servers}) {
  base = base.replace(/\/$/, '') + '/';
  if (!source) return [];
  const name = source.split('/').pop();
  if (name.endsWith('.pdf') && Object.hasOwn(index.pdfs || {}, name) && index.pdfs[name] === null) return [];
  let key = index.sources?.[source];
  if (name.endsWith('.pdf') && index.pdfs?.[name]) key = index.pdfs[name];
  if (source.startsWith(base)) key = source.slice(base.length);
  for (const server of servers) if (!key && source.startsWith(server)) key = 'score-assets/' + source.slice(server.length);
  const urls = key ? [base + key] : [];
  if (key?.startsWith('score-assets/')) urls.push(...servers.map(s => s + key.slice('score-assets/'.length)));
  if (key) for (const [url, value] of Object.entries(index.sources || {})) if (value === key) urls.push(url);
  urls.push(source);
  return [...new Set(urls)].filter(url => !(index.blocked || []).includes(url));
}
export async function firstAvailable(urls, check) {
  let uncertainty;
  for (const url of urls) {
    try { if (await check(url)) return url; }
    catch (error) { uncertainty = new Error(`${url}: ${error.message}`, {cause: error}); }
  }
  if (uncertainty) throw uncertainty;
  return null;
}
