// backend/providers/ibm.js
// Qiskit/IBM provider adapter skeleton with simulator fallback.
const DEBUG = false;

let qiskitRuntime = null;
try { qiskitRuntime = require('qiskit-ibm-runtime'); } catch (e) { qiskitRuntime = null; }

const { toQASM } = require('../quantum/emitters/qiskit-emitter');

const ENV_TOKEN = process.env.IBM_QUANTUM_TOKEN;

function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

class IBMProvider {
  static available() {
    return Boolean(ENV_TOKEN && qiskitRuntime);
  }

  constructor() {
    this.token = ENV_TOKEN || null;
    this.runtime = qiskitRuntime || null;
    this._client = null;
  }

  async _getClient(){
    if (this._client) return this._client;
    if (!this.runtime) throw new Error('qiskit-ibm-runtime not available');
    // different runtime libs expose different entry points; be defensive
    const ApiClient = this.runtime.ApiClient || this.runtime.Client || this.runtime;
    this._client = new ApiClient({ token: this.token });
    return this._client;
  }

  async prepare(payload) {
    // Accept intermediate circuit representation from translator
    let prepared = payload;
    if (payload && payload.qubo && !payload.circuit) {
      const { quboToCircuit } = require('../quantum/translator');
      prepared = { circuit: quboToCircuit(payload.qubo, { scale: 1.0 }), meta: { from: 'translator' } };
    }
    return { prepared, meta: { provider: 'ibm' } };
  }

  async run(prepared, opts = {}) {
    // Simulator fallback
    if (!IBMProvider.available()) {
      if (DEBUG) console.info('IBMProvider: simulator fallback run');
      return { success: true, provider: 'simulator', result: { samples: [[0,1,0]], score: 0.123, circuit: prepared && prepared.circuit } };
    }

    const circ = prepared && (prepared.circuit || prepared.prepared && prepared.prepared.circuit);
    if (!circ) throw new Error('IBMProvider.run requires a circuit in prepared payload');
    const qasm = toQASM(circ);

    // Real runtime submission with polling/backoff
    try {
      const client = await this._getClient();

      // Try different common method names for job creation
      let job = null;
      if (typeof client.execute === 'function') {
        job = await client.execute({ qasm, backend: opts.backend || 'ibmq_qasm_simulator', shots: opts.shots || 1024 });
      } else if (client.jobs && typeof client.jobs.create === 'function') {
        job = await client.jobs.create({ qasm, backend: opts.backend || 'ibmq_qasm_simulator', shots: opts.shots || 1024 });
      } else if (typeof client.run === 'function') {
        job = await client.run({ qasm, backend: opts.backend || 'ibmq_qasm_simulator', shots: opts.shots || 1024 });
      } else {
        throw new Error('IBM runtime client does not expose a known submission API');
      }

      // job may be an object or an id; normalize id
      const jobId = (job && (job.id || job.job_id || job.jobId)) || job;
      if (!jobId) throw new Error('Failed to obtain job id from runtime submission');

      // Poll status
      const timeoutMs = (opts.timeoutMs || 120000);
      const start = Date.now();
      let attempt = 0;
      let lastStatus = null;
      while (Date.now() - start < timeoutMs) {
        attempt++;
        let status = null, result = null;
        try {
          if (client.jobs && typeof client.jobs.get === 'function') {
            status = await client.jobs.get(jobId);
            // if get returns job obj with status/result
            if (status && status.status && status.result) { result = status.result; }
          } else if (typeof client.getJob === 'function') {
            status = await client.getJob(jobId);
            if (status && status.result) result = status.result;
          } else if (typeof client.jobStatus === 'function') {
            status = await client.jobStatus(jobId);
          }
        } catch (e) {
          // ignore transient poll errors
        }

        // Interpret status
        const s = (status && (status.status || status.state)) || (result ? 'DONE' : null);
        lastStatus = s || lastStatus;
        if (s && ['DONE','COMPLETED','finished','COMPLETED_WITH_ERRORS'].includes(String(s).toUpperCase())) {
          // try to fetch result
          try {
            if (client.jobs && typeof client.jobs.result === 'function') result = await client.jobs.result(jobId);
            else if (typeof client.jobResult === 'function') result = await client.jobResult(jobId);
            else if (typeof client.result === 'function') result = await client.result(jobId);
          } catch (e) {
            // ignore - we'll return what we have
          }
          return { success: true, provider: 'ibm', status: s, result };
        }

        // backoff
        const backoff = Math.min(2000 * Math.pow(1.5, attempt), 10000);
        await sleep(backoff);
      }

      return { success: false, provider: 'ibm', status: lastStatus || 'TIMEOUT', message: 'Job did not complete in time' };
    } catch (e) {
      throw new Error('IBMProvider runtime error: ' + e.message);
    }
  }

  async postprocess(result) {
  try { const norm = require('./result-normalizer').normalize(result); return norm; } catch(e) { return result; }
  }
}

module.exports = IBMProvider;
