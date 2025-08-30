// backend/providers/result-normalizer.js
// Normalize provider-specific result payloads into a common shape:
// { samples: [[bits]], counts: { '010': n }, energy?: number, score?: number }

function normalize(result){
  if (!result) return { samples: [], counts: {}, score: null };
  // If result already has counts or samples, pass through with minimal normalizing
  const out = {};
  if (result.samples) out.samples = result.samples;
  if (result.counts) out.counts = result.counts;
  if (result.energy !== undefined) out.energy = result.energy;
  if (result.score !== undefined) out.score = result.score;

  // handle common IBM-like shapes (jobs API)
  if (!out.samples && result.data && Array.isArray(result.data)){
    // try to interpret as list of bitstrings
    out.samples = result.data.map(d => Array.isArray(d) ? d : String(d).split('').map(x=>Number(x)));
  }

  // handle counts map
  if (!out.counts && result.measurement_results && typeof result.measurement_results === 'object'){
    out.counts = result.measurement_results;
  }

  // if samples present but not counts, compute counts
  if (out.samples && !out.counts){
    out.counts = {};
    for (const s of out.samples){
      const k = s.join(''); out.counts[k] = (out.counts[k]||0) + 1;
    }
  }

  // fallback: if result has 'counts' as nested job result
  if (!out.counts && result.result && result.result.counts) out.counts = result.result.counts;

  return out;
}

module.exports = { normalize };
