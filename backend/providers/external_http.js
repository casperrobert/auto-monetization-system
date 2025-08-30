// backend/providers/external_http.js
// Sends prepared payload to an external HTTP quantum gateway.

const EXT_URL = process.env.EXT_PROVIDER_URL || null;
const EXT_KEY = process.env.EXT_PROVIDER_API_KEY || null;

class ExternalHTTPProvider {
  static available() { return Boolean(EXT_URL); }

  constructor(){ this.url = EXT_URL; this.key = EXT_KEY; }

  async prepare(payload){ return { prepared: payload, meta:{ provider: 'external_http' } }; }

  async run(prepared, opts={}){
    if (!ExternalHTTPProvider.available()) return { success:true, provider:'simulator', result:{ samples:[], info:'no external url' } };
    // lazy-require node-fetch so missing optional dep doesn't crash require-time
    let fetcher;
    try { fetcher = require('node-fetch'); } catch(e) {
      if (typeof fetch !== 'undefined') fetcher = fetch;
      else throw new Error('node-fetch is required for external_http provider but not installed');
    }
    const body = { payload: prepared.prepared, opts };
    const headers = { 'Content-Type':'application/json' };
    if (this.key) headers['Authorization'] = `Bearer ${this.key}`;
    const resp = await fetcher(this.url, { method:'POST', headers, body: JSON.stringify(body), timeout: 60000 });
    if (!resp.ok) throw new Error(`External provider response ${resp.status}`);
    const data = await resp.json();
    return { success:true, provider:'external_http', result: data };
  }

  async postprocess(result){ return result; }
}

module.exports = ExternalHTTPProvider;
