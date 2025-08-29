#!/usr/bin/env node
/**
 * Projekt-Überblick für die Konsole
 * Features:
 *  - Directory-Tree (ohne node_modules)
 *  - package.json: Name, Version, Scripts, Dependencies
 *  - Erkennung: models/, routes/, controllers/
 *  - Express-Routen aus Code (app.get/post/..., router.get/post/...) per Regex
 *
 * Nutzung:
 *   node scripts/project-overview.js            -> Standard (Tiefe 3)
 *   node scripts/project-overview.js --depth 4  -> Tree-Tiefe anpassen
 *   node scripts/project-overview.js --full     -> vollständiger Tree
 *   node scripts/project-overview.js --routes   -> nur Routen-Analyse
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const Table = require('cli-table3');

const CWD = process.cwd();
const args = process.argv.slice(2);
const isFlag = (f) => args.includes(f);
const getArgVal = (flag, def) => {
  const i = args.indexOf(flag);
  if (i >= 0 && args[i + 1]) return args[i + 1];
  return def;
};

const MAX_DEPTH = isFlag('--full') ? Infinity : parseInt(getArgVal('--depth', '3'), 10) || 3;
const SHOW_ONLY_ROUTES = isFlag('--routes');

// ---------- Utils ----------
const ignoreNames = new Set(['node_modules', '.git', '.next', 'dist', 'build', '.pnpm-store', '.cache', '.DS_Store']);

function isTextFile(file) {
  const ext = path.extname(file).toLowerCase();
  return ['.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.md', '.html', '.css'].includes(ext);
}

function readSafeJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function listDirTree(root, depth = 0, out = []) {
  if (depth > MAX_DEPTH) return out;
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch { return out; }

  for (const e of entries) {
    if (ignoreNames.has(e.name)) continue;
    const full = path.join(root, e.name);
    const rel = path.relative(CWD, full) || '.';
    out.push({ depth, name: e.name, rel, isDir: e.isDirectory() });
    if (e.isDirectory()) listDirTree(full, depth + 1, out);
  }
  return out;
}

function drawTree(entries) {
  const lines = [];
  let prevDepth = 0;
  for (const e of entries) {
    const indent = '  '.repeat(e.depth);
    const bullet = e.isDir ? chalk.blue('📁') : '📄';
    lines.push(`${indent}${bullet} ${e.name}`);
    prevDepth = e.depth;
  }
  return lines.join('\n');
}

function walkFiles(root, collector = []) {
  let entries = [];
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return collector; }
  for (const e of entries) {
    if (ignoreNames.has(e.name)) continue;
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      walkFiles(full, collector);
    } else {
      collector.push(full);
    }
  }
  return collector;
}

function filterByDir(files, dirName) {
  return files.filter(f => f.split(path.sep).includes(dirName) && f.endsWith('.js'));
}

function readFileSafe(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

// Express-Route Regex: app.get('/x', …) | router.post("/y", …)
const routeRegex = /\b(app|router)\s*\.\s*(get|post|put|delete|patch|options|head|all)\s*\(\s*(['"`])([^'"`]+)\3\s*,/g;

function extractRoutesFromFile(file) {
  const code = readFileSafe(file);
  const found = [];
  let m;
  while ((m = routeRegex.exec(code))) {
    found.push({ where: m[1], method: m[2].toUpperCase(), path: m[4], file });
  }
  return found;
}

// ---------- Ausgabe-Abschnitte ----------
function printHeader(title) {
  console.log(chalk.bold.cyan('\n=== ' + title + ' ===\n'));
}

function printPackageInfo() {
  const pkg = readSafeJSON(path.join(CWD, 'package.json'));
  if (!pkg) {
    console.log(chalk.red('Keine package.json gefunden.'));
    return;
  }

  const metaTable = new Table({ head: [chalk.green('Feld'), chalk.green('Wert')], colWidths: [18, 80] });
  metaTable.push(['Name', pkg.name || '-'], ['Version', pkg.version || '-'], ['Main', pkg.main || '-']);
  console.log(metaTable.toString());

  if (pkg.scripts && Object.keys(pkg.scripts).length) {
    const sTable = new Table({ head: [chalk.blue('Script'), chalk.blue('Befehl')], colWidths: [22, 76] });
    for (const [k, v] of Object.entries(pkg.scripts)) sTable.push([k, v]);
    printHeader('npm Scripts');
    console.log(sTable.toString());
  }

  const depTable = new Table({ head: [chalk.yellow('Dependency'), chalk.yellow('Version')], colWidths: [40, 20] });
  const devDepTable = new Table({ head: [chalk.yellow('DevDependency'), chalk.yellow('Version')], colWidths: [40, 20] });

  if (pkg.dependencies) {
    printHeader('Dependencies');
    for (const [k, v] of Object.entries(pkg.dependencies)) depTable.push([k, v]);
    console.log(depTable.toString());
  }
  if (pkg.devDependencies) {
    printHeader('DevDependencies');
    for (const [k, v] of Object.entries(pkg.devDependencies)) devDepTable.push([k, v]);
    console.log(devDepTable.toString());
  }
}

function printTree() {
  printHeader(`Projektstruktur (Tiefe: ${MAX_DEPTH === Infinity ? 'voll' : MAX_DEPTH})`);
  const entries = listDirTree(CWD, 0, []);
  console.log(drawTree(entries));
}

function printBuckets(files) {
  const models = filterByDir(files, 'models');
  const routes = filterByDir(files, 'routes');
  const controllers = filterByDir(files, 'controllers');

  const table = new Table({
    head: [chalk.magenta('Bucket'), chalk.magenta('Dateien')],
    colWidths: [18, 90],
    wordWrap: true
  });

  const fmt = (arr) => arr.length ? arr.map(f => path.relative(CWD, f)).join('\n') : chalk.gray('—');

  table.push(
    ['models', fmt(models)],
    ['routes', fmt(routes)],
    ['controllers', fmt(controllers)]
  );

  printHeader('Buckets (models / routes / controllers)');
  console.log(table.toString());

  return { models, routes, controllers };
}

function printRoutes(files) {
  const jsFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.mjs') || f.endsWith('.cjs'));
  const allRoutes = jsFiles.flatMap(extractRoutesFromFile);

  const table = new Table({
    head: [chalk.yellow('Methode'), chalk.yellow('Pfad'), chalk.yellow('Quelle')],
    colWidths: [10, 40, 58],
    wordWrap: true
  });

  if (!allRoutes.length) {
    printHeader('Express-Routen (per Regex erkannt)');
    console.log(chalk.gray('Keine Routen erkannt. (Nutzen dein Code app/router.* Aufrufe?)'));
    return;
  }

  for (const r of allRoutes) {
    table.push([r.method, r.path, path.relative(CWD, r.file)]);
  }

  printHeader('Express-Routen (per Regex erkannt)');
  console.log(table.toString());
}

function printEnvKeys() {
  const dotenvPath = path.join(CWD, '.env');
  if (!fs.existsSync(dotenvPath)) return;
  const lines = readFileSafe(dotenvPath).split(/\r?\n/).filter(Boolean);
  const keys = lines
    .map(l => l.trim())
    .filter(l => !l.startsWith('#') && l.includes('='))
    .map(l => l.split('=')[0]);

  if (!keys.length) return;

  const table = new Table({ head: [chalk.green('ENV Keys (ohne Werte)')], colWidths: [70] });
  keys.forEach(k => table.push([k]));
  printHeader('.env Keys');
  console.log(table.toString());
}

// ---------- Main ----------
(function main() {
  try {
    if (!SHOW_ONLY_ROUTES) {
      printHeader('Projekt-Überblick');
      printPackageInfo();
      printEnvKeys();
      printTree();
    }

    const allFiles = walkFiles(CWD, []);
    const { /*models, routes, controllers*/ } = SHOW_ONLY_ROUTES ? {} : printBuckets(allFiles);
    printRoutes(allFiles);

    console.log(chalk.bold.green('\nFertig ✅\n'));
  } catch (e) {
    console.error(chalk.red('Fehler im Overview-Script:'), e?.message || e);
    process.exit(1);
  }
})();

// models/courses.js
module.exports = [
  { id: 1, title: "Kurs A", price: 49 },
  { id: 2, title: "Kurs B", price: 79 }
];

// models/dropshipping.js
module.exports = [
  { id: 1, product: "T-Shirt", profit: 12.5 },
  { id: 2, product: "Sneaker", profit: 34.9 }
];


// models/dividends.js
module.exports = [
  { id: 1, company: "Apple", amount: 5.2 },
  { id: 2, company: "Microsoft", amount: 4.8 }
];

