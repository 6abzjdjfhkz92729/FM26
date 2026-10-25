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
const requiredScripts = ['fm26-europe.js','fm26-phase1.js','fm26-engine.js','fm26-advanced.js','fm26-world.js','fm26-experience.js','fm26-international.js','fm26-phase2-3.js','fm26-reference-ui.js','fm26-tactics-dnd.js','fm26-pro-career.js'];
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
for (const api of ['window.FMX','window.FM26A','window.FM26UX','window.FM26I','window.XF','window.XE','window.XF3']) assert.ok(allSource.includes(api), 'missing module API ' + api);

const lgAt = html.indexOf('const LG=');
assert.ok(lgAt >= 0, 'league data is missing');
const lgOpen = html.indexOf('{', lgAt);
const lgEnd = blockEnd(html, lgOpen);
const LG = runInNewContext('(' + html.slice(lgOpen, lgEnd) + ')', {}, { timeout: 1000 });
const europeScript = readFileSync(resolve(root, 'fm26-europe.js'), 'utf8');
const extraAt = europeScript.indexOf('const FM26_EUROPE_EXTRA_DATA =');
assert.ok(extraAt >= 0, 'additional European league data is missing');
const extraOpen = europeScript.indexOf('{', extraAt);
const extraEnd = blockEnd(europeScript, extraOpen);
const extraLeagues = runInNewContext('(' + europeScript.slice(extraOpen, extraEnd) + ')', {}, { timeout: 1000 });
for (const [league, clubs] of Object.entries(extraLeagues)) {
  assert.ok(!LG[league], 'additional league unexpectedly overwrites an existing league: ' + league);
  assert.ok(Array.isArray(clubs) && clubs.length >= 10, league + ' has too few clubs');
  LG[league] = clubs;
}
assert.ok(Object.keys(LG).length >= 39, 'expected at least 39 divisions after European expansion');
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
assert.match(engine, /row\('Tirs',shots\)/, 'data centre must display total shots');
const advanced = readFileSync(resolve(root, 'fm26-advanced.js'), 'utf8');
assert.match(advanced, /function cupStageLabel\(state,round\)/, 'cup rounds must use a bracket-aware stage label');
assert.match(advanced, /byesByRound/, 'smaller cups must track teams receiving a bye');
assert.match(advanced, /turn=cupStageLabel\(state,nextRound\)/, 'cup progression must calculate the next stage outside the fixture loop');
assert.match(advanced, /const pool=\[\.\.\.new Set\(cupTeamPool\(\)/, 'continental cup entrants must be unique');

const builderAt = advanced.indexOf('const addTournament=');
assert.ok(builderAt >= 0, 'cup bracket builder is missing');
const builderOpen = advanced.indexOf('{', builderAt);
const builderEnd = blockEnd(advanced, builderOpen);
const builderBody = advanced.slice(builderOpen, builderEnd);
const builder = runInNewContext('(function addTournament(key,name,entrants,offset)' + builderBody + ')', {
  S: { fx: [], date: '2026-08-01', cupComps: {} }
}, { timeout: 1000 });
const entrants12 = ['Bye A','Bye B','Bye C','Bye D','Manager FC','Club 6','Club 7','Club 8','Club 9','Club 10','Club 11','Club 12'];
const cupState = { fx: [], date: '2026-08-01', cupComps: {}, club: 'Manager FC' };
const addCup = runInNewContext('(function addTournament(key,name,entrants,offset)' + builderBody + ')', { S: cupState }, { timeout: 1000 });
addCup('domestic', 'Test Cup', entrants12, 10);
assert.equal(cupState.fx.length, 4, 'a 12-team cup must create four opening ties');
assert.equal(cupState.cupComps.domestic.bracketSize, 16, 'a 12-team cup must use a 16-slot bracket');
assert.equal(cupState.cupComps.domestic.byesByRound[1].length, 4, 'four teams must receive first-round byes');

const stageAt = advanced.indexOf('function cupStageLabel');
assert.ok(stageAt >= 0, 'cup stage label helper is missing');
const stageOpen = advanced.indexOf('{', stageAt);
const stageEnd = blockEnd(advanced, stageOpen);
const stageLabel = runInNewContext('(' + advanced.slice(stageAt, stageEnd) + ')', {}, { timeout: 1000 });
assert.equal(stageLabel({ bracketSize: 16 }, 1), 'Huitièmes de finale');
assert.equal(stageLabel({ bracketSize: 16 }, 4), 'Finale');
assert.equal(stageLabel({ bracketSize: 8 }, 1), 'Quarts de finale');

const advanceAt = advanced.indexOf('function advanceCup(');
assert.ok(advanceAt >= 0, 'cup progression function is missing');
const advanceOpen = advanced.indexOf('{', advanceAt);
const advanceEnd = blockEnd(advanced, advanceOpen);
const advanceSource = advanced.slice(advanceAt, advanceEnd);
const firstTie = cupState.fx.find(f => f.home === 'Manager FC');
assert.ok(firstTie, 'manager club must have an opening cup tie in the fixture test');
firstTie.played = true;
firstTie.score = '1-0';
const cupSandbox = {
  S: cupState,
  simLeagueScore: () => [1, 0],
  pick: values => values[0],
  cupStageLabel: stageLabel,
  mail: () => {},
  sv: () => {},
  simulateRemainingCup: () => {}
};
const advanceCup = runInNewContext('(' + advanceSource + ')', cupSandbox, { timeout: 1000 });
for (let round = 1; round <= 4; round++) {
  if (round > 1) {
    const tie = cupState.fx.find(f => f.cupKey === 'domestic' && f.cupRound === round && !f.played && (f.home === cupState.club || f.away === cupState.club));
    assert.ok(tie, 'manager should have a fixture at cup round ' + round);
    tie.played = true;
    tie.score = tie.home === cupState.club ? '2-0' : '0-2';
  }
  const tie = cupState.fx.find(f => f.cupKey === 'domestic' && f.cupRound === round && f.played && (f.home === cupState.club || f.away === cupState.club));
  advanceCup(tie);
  if (round < 4) {
    assert.equal(cupState.cupComps.domestic.round, round + 1, 'cup should advance from round ' + round);
  } else {
    assert.equal(cupState.cupComps.domestic.done, true, 'winning the final must finish the cup');
    assert.equal(cupState.cupComps.domestic.champion, cupState.club, 'the manager club must win the test cup');
  }
}
console.log('FM26 validation OK');
console.log('JS files checked: ' + scriptFiles.length + ' modules + ' + inlineScripts.length + ' inline scripts');
console.log('Divisions: ' + Object.keys(LG).length + ' | club entries: ' + clubEntries + ' | fixture schedules: ' + fixturesChecked);
