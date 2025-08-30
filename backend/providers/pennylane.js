// backend/providers/pennylane.js
// PennyLane adapter skeleton with simulator fallback.

let pennylane = null;
try { pennylane = require('pennylane'); } catch (e) { pennylane = null; }

const { toPennyLaneJSON } = require('../quantum/emitters/pennylane-emitter');
const { spawnSync } = require('child_process');
const ENV_PL_DEVICE = process.env.PL_DEVICE;

class PennyLaneProvider {
  static available() {
    return Boolean(pennylane || ENV_PL_DEVICE);
  }

  constructor() {
    this.device = ENV_PL_DEVICE || 'default.qubit';
  }

  async prepare(payload) {
    return { prepared: payload, meta: { provider: 'pennylane', device: this.device } };
  }

  async run(prepared, opts = {}) {
    // If no Node-level pennylane lib, try to invoke a python helper if available
    if (!pennylane) {
      // try python bridge: look for PL_HELPER environment var pointing to a script
      const helper = process.env.PL_HELPER || null;
      if (helper) {
        const circ = prepared && (prepared.circuit || prepared.prepared && prepared.prepared.circuit);
        const payload = JSON.stringify({ circ, opts });
        const res = spawnSync('python3', [helper], { input: payload, encoding: 'utf8', timeout: 60000 });
        if (res.status === 0) {
          try { const data = JSON.parse(res.stdout); return { success: true, provider: 'pennylane', result: data }; } catch(e){ return { success: false, provider: 'pennylane', error: 'invalid helper output' }; }
        }
      }
      // final fallback: simulator placeholder
      return { success: true, provider: 'simulator', result: { samples: [[0]], score: 0 } };
    }
    throw new Error('PennyLane real execution via Node pennylane not implemented; consider using PL_HELPER python bridge.');
  }

  async postprocess(result) { try { const norm = require('./result-normalizer').normalize(result); return norm; } catch(e) { return result; } }
}

module.exports = PennyLaneProvider;
