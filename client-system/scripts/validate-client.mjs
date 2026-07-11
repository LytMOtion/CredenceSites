#!/usr/bin/env node
/* ============================================================================
   validate-client.mjs — validate a client's input before a build
   Usage: node client-system/scripts/validate-client.mjs --client <slug> [--production]
   Exit code 0 = no blocking errors; 1 = blocking errors present.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { validate } from '../lib/schema.mjs';
import { loadClient } from '../lib/model.mjs';
import { SCHEMAS_DIR, MANIFESTS_DIR, readJson, tryReadJson, urlKind, color, log, parseArgs, SYSTEMS } from '../lib/util.mjs';

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const VID_EXT = ['.mp4', '.webm'];

export function validateClient(slug, opts = {}) {
  const errors = [], warnings = [], passed = [];
  const E = (m) => errors.push(m), W = (m) => warnings.push(m), P = (m) => passed.push(m);

  let input;
  try { input = loadClient(slug); } catch (e) { return { errors: [e.message], warnings, passed }; }
  const c = input.client;
  const production = opts.production || c.siteMode === 'production';

  if (!SYSTEMS.includes(c.system)) E('client.json: "system" must be one of ' + SYSTEMS.join(', '));
  else P('system is a known Course System (' + c.system + ')');

  // ---- schema: client.json ----
  const clientErrs = validate(readJson(path.join(SCHEMAS_DIR, 'client.schema.json')), c, 'client');
  clientErrs.forEach((x) => E('client.json ' + x.path + ' ' + x.message));
  if (clientErrs.length === 0) P('client.json matches schema');

  // ---- content.json ----
  if (input.contentError) E('content.json: ' + input.contentError);
  else if (input.content && SYSTEMS.includes(c.system)) {
    const cs = validate(readJson(path.join(SCHEMAS_DIR, c.system + '.schema.json')), input.content, 'content');
    cs.forEach((x) => E('content.json ' + x.path + ' ' + x.message));
    if (cs.length === 0) P('content.json matches the ' + c.system + ' schema');
  }

  // ---- required business data (draft: warn, production: error) ----
  const need = (val, label) => { if (!val || String(val).trim() === '') (production ? E : W)((production ? 'PRODUCTION requires ' : 'recommended: ') + label + ' is empty'); else P(label + ' present'); };
  need(c.business && c.business.publicName, 'business.publicName');
  need(c.domain, 'domain');
  need(c.contact && c.contact.phone, 'contact.phone');
  need(c.contact && c.contact.email, 'contact.email');
  need(c.location && c.location.city, 'location.city');
  need(input.content && input.content.hero && input.content.hero.headline, 'content.hero.headline');

  // ---- course facts ----
  const facts = input.content && input.content.courseFacts;
  if (facts) {
    if (facts.par && (facts.par < 68 || facts.par > 74)) W('courseFacts.par (' + facts.par + ') is outside the usual 70–72 range — confirm.');
    else P('course facts present');
  }

  // ---- holes.json + scorecard arithmetic ----
  if (input.holesError) { (production ? E : W)('holes.json: ' + input.holesError); }
  else if (input.holes) {
    const hs = validate(readJson(path.join(SCHEMAS_DIR, 'holes.schema.json')), input.holes, 'holes');
    hs.forEach((x) => E('holes.json ' + x.path + ' ' + x.message));
    const holes = input.holes.holes || [];
    const nums = holes.map((h) => h.number);
    for (let i = 1; i <= 18; i++) if (!nums.includes(i)) E('holes.json: hole ' + i + ' is missing (holes 1–18 are required)');
    const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
    if (dup.length) E('holes.json: duplicate hole numbers: ' + [...new Set(dup)].join(', '));
    let outC = 0, inC = 0, badY = false, missStrat = 0, missName = 0, missAlt = 0;
    const siList = [];
    holes.forEach((h) => {
      if (h.par < 3 || h.par > 6) E('holes.json: hole ' + h.number + ' par ' + h.par + ' is implausible');
      // every yardage tee must be numeric (not just championship)
      Object.entries(h.yardages || {}).forEach(([tee, v]) => { if (v != null && typeof v !== 'number') { badY = true; E('holes.json: hole ' + h.number + ' ' + tee + ' yardage "' + v + '" is not numeric'); } });
      const y = (h.yardages || {}).championship;
      if (typeof y === 'number') { if (h.number <= 9) outC += y; else inC += y; }
      // front/back must agree with hole number
      const expectNine = h.number <= 9 ? 'front' : 'back';
      if (h.nine && h.nine !== expectNine) E('holes.json: hole ' + h.number + ' is marked "' + h.nine + '" but must be "' + expectNine + '"');
      if (h.strokeIndex != null) siList.push(h.strokeIndex);
      if (!h.name || !String(h.name).trim()) missName++;
      if (production && (!h.strategy || !h.strategy.trim())) missStrat++;
      if (h.image) {
        const p = path.join(input.imagesDir, h.image);
        if (!fs.existsSync(p)) W('holes.json: hole ' + h.number + ' image "' + h.image + '" not found in images/ (falls back to template photo)');
        if (production && (!h.altText || !String(h.altText).trim())) missAlt++;
      }
    });
    if (badY) E('holes.json: some yardages are not numeric');
    if (missStrat) (production ? E : W)(missStrat + ' hole(s) missing strategy text');
    if (missName) (production ? E : W)(missName + ' hole(s) missing a name');
    if (production && missAlt) E(missAlt + ' hole photo(s) missing altText (required for production accessibility)');
    // stroke index 1–18, complete and unique
    if (siList.length === holes.length) {
      const siDup = siList.filter((n, i) => siList.indexOf(n) !== i);
      const siMissing = []; for (let i = 1; i <= 18; i++) if (!siList.includes(i)) siMissing.push(i);
      if (siDup.length) E('holes.json: duplicate stroke index values: ' + [...new Set(siDup)].join(', '));
      if (siMissing.length && holes.length === 18) W('holes.json: stroke index set is not a complete 1–18 (missing ' + siMissing.join(', ') + ')');
      if (!siDup.length && !siMissing.length && holes.length === 18) P('stroke index is a complete, unique 1–18 set');
    }
    const total = outC + inC;
    if (holes.length === 18 && !badY) {
      P('scorecard totals computed: Out ' + outC + ' / In ' + inC + ' / Total ' + total + ' (championship)');
      const declared = input.holes.declaredTotal;
      if (declared != null && declared !== total) E('holes.json: declaredTotal (' + declared + ') does not match the calculated total (' + total + ')');
    }
    if (hs.length === 0 && !dup.length) P('holes.json structure valid (18 holes)');
  } else if (production) {
    E('PRODUCTION requires holes.json with 18 holes');
  } else {
    W('holes.json not provided — the template scaffolding will be used until you add it');
  }

  // ---- images: required slots + formats + alt ----
  const manifestPath = path.join(MANIFESTS_DIR, c.system + '.images.json');
  if (fs.existsSync(manifestPath)) {
    const man = readJson(manifestPath);
    const present = fs.existsSync(input.imagesDir) ? fs.readdirSync(input.imagesDir) : [];
    (man.slots || []).forEach((s) => {
      const has = present.includes(s.filename);
      if (s.required && !has) (production ? E : W)('image "' + s.filename + '" (' + s.slot + ') is required but not in images/');
      if (has) {
        const ext = path.extname(s.filename).toLowerCase();
        if (![...IMG_EXT, ...VID_EXT].includes(ext)) E('image "' + s.filename + '" has an unsupported format');
        if (production && (!s.altText || !s.altText.trim())) W('image "' + s.filename + '" has no altText in the manifest');
      }
    });
    // unused files
    present.filter((f) => IMG_EXT.includes(path.extname(f).toLowerCase())).forEach((f) => {
      const known = (man.slots || []).some((s) => s.filename === f) || (input.holes && (input.holes.holes || []).some((h) => h.image === f));
      if (!known) W('image "' + f + '" in images/ is not referenced by any slot or hole (unused)');
    });
    P('image manifest checked (' + (man.slots || []).length + ' slots)');
  }

  // ---- logos ----
  const logos = fs.existsSync(input.logosDir) ? fs.readdirSync(input.logosDir).filter((f) => /\.(svg|png|jpg|jpeg|webp)$/i.test(f)) : [];
  if (logos.length === 0) (production ? W : W)('no logo files in logos/ — a text wordmark fallback will be used (production branding incomplete)');
  else P(logos.length + ' logo file(s) present');

  // ---- social + integration URLs ----
  const checkUrls = (obj, labelPrefix) => {
    Object.entries(obj || {}).forEach(([k, v]) => {
      if (!v || String(v).trim() === '') return;
      const kind = urlKind(v);
      if (kind === 'unsafe') E(labelPrefix + '.' + k + ' uses an unsafe javascript: URL');
      else if (kind === 'placeholder') E(labelPrefix + '.' + k + ' is a placeholder "#" — remove it or use a real URL');
      else if (kind === 'invalid') E(labelPrefix + '.' + k + ' is not a valid http(s) URL');
      else if (kind === 'generic') W(labelPrefix + '.' + k + ' points at a generic platform homepage — use the course\'s own page/handle');
      else P(labelPrefix + '.' + k + ' is a valid external URL');
    });
  };
  if (input.socialError) E('social.json: ' + input.socialError); else checkUrls(input.social, 'social');
  if (input.integrationsError) E('integrations.json: ' + input.integrationsError); else checkUrls(input.integrations, 'integrations');
  if (input.integrations && input.integrations.analyticsId && production) W('analyticsId set — confirm the client provided and approved this ID');

  // ---- production-only gating: no demonstration language must remain in inputs ----
  if (production) {
    const blob = JSON.stringify({ c, content: input.content, holes: input.holes });
    if (/fictional|demonstration|Course System 0\d|Ocean Bluff|Alderwick|Canyon House/i.test(blob))
      E('PRODUCTION: demonstration / placeholder language still present in the client input — remove it before going live');
  }

  return { errors, warnings, passed };
}

/* ---- CLI ---- */
if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client || args._[0];
  if (!slug) { log(color.red('Usage: npm run client:validate -- --client <slug> [--production]')); process.exit(2); }
  const r = validateClient(slug, { production: !!args.production });
  log('');
  log(color.bold('Validation report — ' + slug + (args.production ? ' (production)' : ' (draft)')));
  log('');
  if (r.errors.length) { log(color.red(color.bold('ERRORS (' + r.errors.length + ') — these block a build'))); r.errors.forEach((m) => log(color.red('  ✖ ' + m))); log(''); }
  if (r.warnings.length) { log(color.yellow(color.bold('WARNINGS (' + r.warnings.length + ') — a draft can still build'))); r.warnings.forEach((m) => log(color.yellow('  ! ' + m))); log(''); }
  log(color.green(color.bold('PASSED CHECKS (' + r.passed.length + ')'))); r.passed.forEach((m) => log(color.green('  ✓ ' + m)));
  log('');
  if (r.errors.length) { log(color.red('Result: ' + r.errors.length + ' blocking error(s). Fix them, then re-run.')); process.exit(1); }
  log(color.green('Result: no blocking errors' + (r.warnings.length ? ' (' + r.warnings.length + ' warning(s) to review).' : '.')));
  process.exit(0);
}
