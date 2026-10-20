import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';

const root = process.cwd();
const html = readFileSync(resolve(root, 'index.html'), 'utf8');
assert.match(html, /<html\b[^>]*\blang=["']fr["']/i, 'page must declare French');
assert.match(html, /<title>[^<]*FM26/i, 'page title must identify FM26');

function blockEnd(source, openAt) {
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = openAt; i < source.length; i++) {
    const c = source[i], n = source[i + 1];
    if (lineComment) { if (c === '\n') lineComment = false; continue; }
    if (blockComment) { if (c === '*' && n === '/') { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '/' && n === '/') { lineComment = true; i++; continue; }
    if (c === '/' && n === '*') { blockComment = true; i++; continue; }
    if (c === '"' || c === "'" || c.charCodeAt(0) === 96) { quote = c; continue; }
    if (c === '{') depth++;
    if (c === '}' && --depth === 0) return i + 1;
  }
  throw new Error('Unbalanced JavaScript braces');
}

const scriptFiles = [...html.matchAll(/<script\b[^>]*\bsrc=["']\.\/([^"']+)["'][^>]*>\s*<\/script>/gi)].map(m => m[1]);
const requiredScripts = ['fm26-phase1.js','fm26-engine.js','fm26-advanced.js','fm26-world.js','fm26-experience.js','fm26-international.js'];
for (const file of requiredScripts) assert.ok(scriptFiles.includes(file), 'index.html must load ' + file);
for (const file of scriptFiles) assert.ok(existsSync(resolve(root, file)), 'missing script: ' + file);
assert.deepEqual(scriptFiles.filter(x => requiredScripts.includes(x)), requiredScripts, 'modules are in the wrong dependency order');

const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]).filter(x => x.trim());
const tempDir = mkdtempSync(join(tmpdir(), 'fm26-check-'));
function syntaxCheck(path) {
  const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
  assert.equal(result.status, 0, 'syntax error in ' + path + '\n' + (result.stderr || result.stdout));
}
try {
  scriptFiles.forEach(file => syntaxCheck(resolve(root, file)));
  inlineScripts.forEach((code, i) => {
    const path = join(tempDir, 'inline-' + i + '.js');
    writeFileSync(path, code, 'utf8');
    syntaxCheck(path);
  });
} finally { rmSync(tempDir, { recursive: true, force: true }); }

for (const id of ['setup','app','side','hd','vw','go']) {
  assert.ok(html.includes('id="' + id + '"') || html.includes("id='" + id + "'"), 'missing interface element #' + id);
}
const allSource = [html, ...scriptFiles.map(file => readFileSync(resolve(root, file), 'utf8'))].join('\n');
const requiredViews = ['home','inbox','squad','player','tactics','sched','comp','fin','mgr','train','xfer','save','data','academy','staff','contracts','scouting','club','press','history','settings','offers','talk','lineup','profile','international'];
for (const view of requiredViews) assert.ok(new RegExp('\\bV\\.' + view + '\\s*=').test(allSource), 'missing view renderer: ' + view);
for (const token of ['function mkFx()', 'const upd=', 'const tbl=', 'function startMatch(', 'function tick(', 'function endMatch(']) assert.ok(html.includes(token), 'missing core function ' + token);
for (const api of ['window.FMX','window.FM26A','window.FM26UX','window.FM26I','window.XF']) assert.ok(allSource.includes(api), 'missing module API ' + api);

const lgAt = html.indexOf('const LG=');
assert.ok(lgAt >= 0, 'league data is missing');
const lgOpen = html.indexOf('{', lgAt);
const lgEnd = blockEnd(html, lgOpen);
const LG = runInNewContext('(' + html.slice(lgOpen, lgEnd) + ')', {}, { timeout: 1000 });
assert.ok(Object.keys(LG).length >= 30, 'expected at least 30 divisions');
const clubEntries = Object.values(LG).reduce((sum, clubs) => sum + clubs.length, 0);
assert.ok(clubEntries >= 500, 'too few club entries');

const mkAt = html.indexOf('function mkFx()');
assert.ok(mkAt >= 0, 'fixture generator is missing');
const mkOpen = html.indexOf('{', mkAt);
const mkEnd = blockEnd(html, mkOpen);
const mkSource = html.slice(mkAt, mkEnd);
let fixturesChecked = 0;
for (const [league, clubs] of Object.entries(LG)) {
  assert.ok(Array.isArray(clubs) && clubs.length >= 2, league + ' has too few clubs');
  assert.equal(new Set(clubs).size, clubs.length, league + ' has duplicate club names');
  const generated = runInNewContext('(' + mkSource + ')()', { LG, S: { lg: league, date: '2026-08-01' } }, { timeout: 1000 });
  assert.equal(generated.length, clubs.length * (clubs.length - 1), league + ': incorrect fixture count');
  assert.equal(new Set(generated.map(f => f.id)).size, generated.length, league + ': duplicate fixture IDs');
  assert.ok(generated.every(f => clubs.includes(f.home) && clubs.includes(f.away) && f.home !== f.away), league + ': invalid teams');
  const pairs = new Map(), rounds = new Map(), homes = new Map(), aways = new Map();
  for (const f of generated) {
    const pair = [f.home,f.away].sort().join(' :: ');
    pairs.set(pair, (pairs.get(pair) || 0) + 1);
    if (!rounds.has(f.round)) rounds.set(f.round, new Set());
    const used = rounds.get(f.round);
    assert.ok(!used.has(f.home) && !used.has(f.away), league + ': a team plays twice in one round');
    used.add(f.home); used.add(f.away);
    homes.set(f.home, (homes.get(f.home) || 0) + 1);
    aways.set(f.away, (aways.get(f.away) || 0) + 1);
  }
  assert.ok([...pairs.values()].every(n => n === 2), league + ': every pair must meet twice');
  assert.ok(clubs.every(c => homes.get(c) === clubs.length - 1 && aways.get(c) === clubs.length - 1), league + ': home/away imbalance');
  assert.equal(rounds.size, 2 * (clubs.length % 2 ? clubs.length : clubs.length - 1), league + ': wrong number of rounds');
  fixturesChecked += generated.length;
}
const engine = readFileSync(resolve(root, 'fm26-engine.js'), 'utf8');
assert.match(engine, /shots:\[0,0\]/, 'total shots must be tracked separately from shots on target');
assert.match(engine, /oldLeague=S\.fx\.filter/, 'calendar migration must ignore cup fixtures when counting league fixtures');
console.log('FM26 validation OK');
console.log('JS files checked: ' + scriptFiles.length + ' modules + ' + inlineScripts.length + ' inline scripts');
console.log('Divisions: ' + Object.keys(LG).length + ' | club entries: ' + clubEntries + ' | fixture schedules: ' + fixturesChecked);
