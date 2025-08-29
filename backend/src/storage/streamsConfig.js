const fs = require('fs');
const path = require('path');
const DATA_DIR = path.join(process.cwd(),'data');
const FILE = path.join(DATA_DIR,'streams-config.json');

function read() {
  try {
    return JSON.parse(fs.readFileSync(FILE,'utf8'));
  } catch (e) {
    return [];
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}

function getAll() { return read(); }
function getById(id){ return read().find(s=>s.id===id); }
function save(cfg){ const list=read(); const idx=list.findIndex(s=>s.id===cfg.id); if(idx>=0) { list[idx]=cfg; } else { list.push(cfg); } write(list); return cfg; }
function remove(id){ const list=read(); const newList=list.filter(s=>s.id!==id); write(newList); return true; }

module.exports = { getAll, getById, save, remove };
