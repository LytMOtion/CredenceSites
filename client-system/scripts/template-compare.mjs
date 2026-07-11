#!/usr/bin/env node
/* ============================================================================
   template-compare.mjs — READ-ONLY drift report between a protected generator
   template and its public master demonstration.

     node client-system/scripts/template-compare.mjs --system <coastal|parkland|desert>

   It NEVER writes, copies, or syncs anything. It only reports which files differ
   so a human can decide whether an approved improvement to a public master should
   be intentionally folded into the protected template (see docs → "UPDATING A
   PROTECTED TEMPLATE"). There is deliberately no "apply" / "sync" mode: automatic
   mass-updates could silently overwrite protected work or existing client builds.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TEMPLATES_DIR, REPO_ROOT, SYSTEMS, listFiles, readJson, color, log, err, parseArgs, rel } from '../lib/util.mjs';

const hash = (p) => crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
const relset = (root) => new Set(listFiles(root, null).map((f) => path.relative(root, f).split(path.sep).join('/')));

export function compareTemplate(system) {
  const templateDir = path.join(TEMPLATES_DIR, system);
  const masterDir = path.join(REPO_ROOT, system); // public master: /coastal /parkland /desert
  if (!fs.existsSync(templateDir)) throw new Error('Template not found: ' + rel(templateDir));
  if (!fs.existsSync(masterDir)) throw new Error('Public master not found: ' + rel(masterDir));

  // ignore generator-internal marker/meta files that never exist in the master
  const IGNORE = /(?:TEMPLATE-README\.txt|_meta\.json)$/;
  const tSet = relset(templateDir), mSet = relset(masterDir);
  const onlyTemplate = [], onlyMaster = [], differ = [], same = [];
  for (const f of tSet) {
    if (IGNORE.test(f)) continue;
    if (!mSet.has(f)) { onlyTemplate.push(f); continue; }
    (hash(path.join(templateDir, f)) === hash(path.join(masterDir, f)) ? same : differ).push(f);
  }
  for (const f of mSet) if (!tSet.has(f) && !IGNORE.test(f)) onlyMaster.push(f);

  let tv = 'unknown';
  try { tv = (readJson(path.join(TEMPLATES_DIR, '_meta.json'))[system] || {}).templateVersion || 'unknown'; } catch {}
  return { system, templateVersion: tv, differ: differ.sort(), onlyTemplate: onlyTemplate.sort(), onlyMaster: onlyMaster.sort(), sameCount: same.length };
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const system = args.system || args._[0];
  if (!SYSTEMS.includes(system)) { err('Usage: npm run template:compare -- --system <coastal|parkland|desert>'); process.exit(2); }
  const r = compareTemplate(system);
  log('');
  log(color.bold('Template drift report — ' + system + ' (protected template v' + r.templateVersion + ')'));
  log(color.bold('READ-ONLY. Nothing was modified. This is a review aid, not a sync.'));
  log('');
  log('Comparing: client-system/templates/' + system + '  ⟷  /' + system + '  (public master)');
  log('');
  if (r.differ.length) {
    log(color.yellow(color.bold('CHANGED (' + r.differ.length + ') — content differs between template and master:')));
    r.differ.forEach((f) => log(color.yellow('  ~ ' + f)));
    log('');
  } else log(color.green('No content differences in shared files.') + '\n');
  if (r.onlyMaster.length) { log(color.bold('ONLY IN MASTER (' + r.onlyMaster.length + '):')); r.onlyMaster.forEach((f) => log('  + ' + f)); log(''); }
  if (r.onlyTemplate.length) { log(color.bold('ONLY IN TEMPLATE (' + r.onlyTemplate.length + '):')); r.onlyTemplate.forEach((f) => log('  - ' + f)); log(''); }
  log(color.green('Identical files: ' + r.sameCount));
  log('');
  if (r.differ.length) {
    log('If an approved improvement in /' + system + ' should become part of the generator,');
    log('follow docs → "UPDATING A PROTECTED TEMPLATE": copy intentionally, record the source');
    log('commit, bump the template version in templates/_meta.json, then rebuild all three test');
    log('clients and re-run visual QA. Existing client sites are NOT auto-updated.');
  }
  process.exit(0);
}
