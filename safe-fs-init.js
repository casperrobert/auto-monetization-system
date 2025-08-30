// safe-fs-init.js
// Small shim that wraps fs methods which can fail in restricted Codespaces
// environments (ENOPRO "no filesystem provider"). It intercepts common
// file writes and mkdir calls and falls back to no-op while logging a warning.

const fs = require('fs');
const original = {
  writeFileSync: fs.writeFileSync,
  writeFile: fs.writeFile,
  mkdirSync: fs.mkdirSync,
  mkdir: fs.mkdir,
  openSync: fs.openSync,
  open: fs.open
};

function guard(fnName, fn) {
  return function(...args) {
    try {
      return fn.apply(fs, args);
    } catch (err) {
      if (err && (err.code === 'ENOPRO' || err.message && err.message.includes('no filesystem provider'))) {
        console.warn(`[safe-fs-init] suppressed ${fnName} due to environment: ${err.code || err.message}`);
        // best-effort: return a plausible benign value depending on function
        if (fnName.endsWith('Sync')) return 0;
        const cb = typeof args[args.length-1] === 'function' ? args[args.length-1] : null;
        if (cb) cb(null);
        return;
      }
      throw err;
    }
  };
}

fs.writeFileSync = guard('writeFileSync', original.writeFileSync);
fs.writeFile = guard('writeFile', original.writeFile);
fs.mkdirSync = guard('mkdirSync', original.mkdirSync);
fs.mkdir = guard('mkdir', original.mkdir);
fs.openSync = guard('openSync', original.openSync);
fs.open = guard('open', original.open);

// Export nothing; the module is a preload shim.
module.exports = {};
