#!/usr/bin/env node
/* ============================================================================
   build-client.mjs — generate a standalone client website from a template
   Usage:
     node client-system/scripts/build-client.mjs --client <slug> [--production] [--output <dir>] [--overwrite]
   Safety: never writes into /coastal, /parkland, /desert, the Credence root,
   another client input, or another generated client. Aborts if output exists
   unless --overwrite (which first backs up the previous build).
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { validateClient } from './validate-client.mjs';
import { loadClient, buildModel, DEMO } from '../lib/model.mjs';
import { escapeHtml } from '../lib/render.mjs';
import {
  coastalSelector, coastalPanels, coastalStrip, coastalScorecard,
  desertSelector, desertPanels, desertScorecard, parklandScorecard, totals
} from '../lib/tour.mjs';
import {
  TEMPLATES_DIR, GENERATED_DIR, REPO_ROOT, GENERATOR_VERSION,
  assertSafeOutput, copyDir, listFiles, writeText, writeJson, readJson,
  color, log, err, parseArgs, rel, urlKind
} from '../lib/util.mjs';

function replaceAll(hay, needle, val) { return needle ? hay.split(needle).join(val) : hay; }

/* Per-system homepage hero headline demo strings (exact) → client headline. */
const HERO = {
  coastal: 'Golf at the edge of the Pacific.',
  parkland: 'A tradition of golf<br>and community.',
  desert: 'Golf, shaped by the desert.'
};

function clientWordmark(system, model) {
  const name = escapeHtml(model.publicName || 'Your Golf Club');
  if (system === 'coastal') return name;                 // brand__wordmark (single span)
  return '<b>' + name + '</b><span></span>';             // brand__name (b + subtitle)
}

function socialFooterHtml(social) {
  const map = [['instagram', 'Instagram'], ['facebook', 'Facebook'], ['tiktok', 'TikTok'], ['youtube', 'YouTube']];
  const links = map
    .filter(([k]) => social[k] && urlKind(social[k]) === 'ok')
    .map(([k, label]) => '<a href="' + escapeHtml(social[k]) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>');
  if (!links.length) return '';
  return '<nav class="client-social" aria-label="Social media">' + links.join('') + '</nav>';
}

/* Strip Credence / Course-System / fictional-demonstration attribution.
   These phrases never occur in a real client's content, so removing them
   everywhere is safe. Dash-flexible ([—–-]) to match the templates' em dashes.
   (HTML collapses residual whitespace on render, so no aggressive cleanup needed.) */
function stripAttribution(html) {
  return html
    .replace(/A (?:fictional )?(?:Credence )?Course System(?: 0\d)?(?:\s*[—–-]\s*The \w+)? demonstration\.?/gi, '')
    .replace(/A fictional demonstration of Course System 0\d[^.<"]*\.?/gi, '')
    .replace(/(?:is a |the )?fictional demonstration (?:property|shop|menu|narrative)[^.<"]*\.?/gi, '')
    .replace(/(?:created to (?:present|demonstrate)|to demonstrate|demonstrating) (?:Credence )?Course System 0\d[^.<"]*\.?/gi, '')
    .replace(/(?:Demonstration content|Fictional demonstration(?: menu| content)?)(?: for)?[^.<"]*Course System 0\d[^.<"]*\.?/gi, '')
    .replace(/\s*[—–-]\s*The (Coastal|Parkland|Desert)\b/g, '')
    .replace(/\s*[—–-]\s*Course System 0\d\b/g, '')
    .replace(/\bCredence Course System(?: 0\d)?(?:\s*[—–-]\s*The \w+)?/gi, '')
    .replace(/\bCourse System 0\d(?:\s*[—–-]\s*The \w+)?/gi, '')
    .replace(/\bby Credence\b/gi, '')
    // placeholder photo-source labels + sample/demo data notes (never in real client content)
    .replace(/\b(?:Demonstration|Reference|Sample) imagery?\b/gi, '')
    .replace(/\bsample\s*(?:\/|and)?\s*demonstration (?:content|data)\b/gi, '')
    .replace(/\bdemonstration (?:content|data|property|purposes|images?)\b/gi, '')
    .replace(/\bfictional sample data\b/gi, '')
    .replace(/\bfictional\b/gi, '');
}

/* Clean residue left by phrase removal — leftover "by/for Credence", the word
   "demonstration" (inactive-control affordances → "preview"), double spaces,
   and orphaned punctuation. Protects <script>/<style> blocks so code is untouched. */
function cleanProse(html) {
  const stash = [];
  html = html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (m) => { stash.push(m); return '%%CP%%' + (stash.length - 1) + '%%CP%%'; });
  html = html
    .replace(/<!--(?!\s*(?:CS_|DS_|PK_))[\s\S]*?-->/g, '')   // drop dev comments (keep tour-injection markers)
    .replace(/DEMONSTRATION/g, 'PREVIEW').replace(/Demonstration/g, 'Preview').replace(/demonstration/g, 'preview')
    .replace(/\b(?:by|for) Credence\b/gi, '')
    .replace(/(\S)[ \t]{2,}/g, '$1 ')       // collapse mid-text runs (leading indentation preserved)
    .replace(/[ \t]+([.,;:!?])/g, '$1')       // no space before punctuation
    .replace(/([.!?])[ \t]*\1+/g, '$1')
    .replace(/<p\b[^>]*>\s*<\/p>/gi, '')
    .replace(/<figure\b[^>]*>\s*<\/figure>/gi, '');      // collapse doubled sentence punctuation
  html = html.replace(/%%CP%%(\d+)%%CP%%/g, (m, i) => stash[+i]);
  return html;
}

/* Identity binding shared by HTML and text-asset (CSS/JS) scrubbing. Includes
   UPPERCASE variants so demo names in SVG labels and comment headers are caught. */
function bindIdentity(text, ctx) {
  const { demo, model } = ctx;
  const pub = escapeHtml(model.publicName || demo.full);
  const shortName = escapeHtml(model.shortName || model.publicName || demo.short);
  const tag = escapeHtml(model.tagline || '');
  const pairs = [[demo.full, pub]];
  if (demo.name2 && demo.name2 !== demo.full) pairs.push([demo.name2, pub]);
  pairs.push([demo.short, shortName], [demo.csLabel, tag]);
  // uppercase forms (longest first)
  pairs.push([demo.full.toUpperCase(), pub.toUpperCase()]);
  if (demo.name2 && demo.name2 !== demo.full) pairs.push([demo.name2.toUpperCase(), pub.toUpperCase()]);
  pairs.push([demo.short.toUpperCase(), shortName.toUpperCase()], [demo.csLabel.toUpperCase(), tag.toUpperCase()]);
  for (const [a, b] of pairs) text = replaceAll(text, a, b);
  if (demo.location && model.locationLine) text = replaceAll(text, demo.location, escapeHtml(model.locationLine));
  if (demo.phone && model.contact.phone) text = replaceAll(text, demo.phone, escapeHtml(model.contact.phone));
  return text;
}

/* Scrub copied CSS/JS assets: demo identity in comment headers, and demo data
   values (e.g. coastal data.js). Never renames JS identifiers (window.OCEANBLUFF
   has no space, so it is untouched) — only the string content is cleaned. */
function scrubAssets(out, ctx) {
  const files = listFiles(out, ['.css', '.js', '.mjs']);
  let scrubbed = 0;
  for (const f of files) {
    const before = fs.readFileSync(f, 'utf8');
    let after = stripAttribution(bindIdentity(before, ctx));
    after = after.replace(/DEMONSTRATION/g, 'PREVIEW').replace(/Demonstration/g, 'Preview').replace(/demonstration/g, 'preview');
    if (after !== before) { writeText(f, after); scrubbed++; }
  }
  return scrubbed;
}

function transformHtml(html, ctx) {
  const { system, demo, model, production, social } = ctx;
  // 1) identity bindings (longest → shortest to avoid partial overlaps)
  html = replaceAll(html, demo.full, escapeHtml(model.publicName || demo.full));
  html = replaceAll(html, demo.wordmark, clientWordmark(system, model));
  if (demo.name2 && demo.name2 !== demo.full) html = replaceAll(html, demo.name2, escapeHtml(model.publicName));
  html = replaceAll(html, demo.short, escapeHtml(model.shortName || model.publicName));
  html = replaceAll(html, demo.csLabel, escapeHtml(model.tagline || ''));
  if (demo.location && model.locationLine) html = replaceAll(html, demo.location, escapeHtml(model.locationLine));
  if (demo.phone && model.contact.phone) html = replaceAll(html, demo.phone, escapeHtml(model.contact.phone));
  if (model.heroHeadline) html = replaceAll(html, HERO[system], escapeHtml(model.heroHeadline));
  // 1b) uppercase brand variants (SVG route-trace labels, etc.)
  const pubU = escapeHtml(model.publicName || demo.full).toUpperCase();
  const shortU = escapeHtml(model.shortName || model.publicName || demo.short).toUpperCase();
  if (demo.name2) html = replaceAll(html, demo.name2.toUpperCase(), pubU);
  html = replaceAll(html, demo.full.toUpperCase(), pubU);
  html = replaceAll(html, demo.short.toUpperCase(), shortU);
  // 1c) remove placeholder image-source caption labels (demo affordance, not client content)
  html = html.replace(/<(span|figcaption)\b[^>]*class="[^"]*(?:__ref|__tag)[^"]*"[^>]*>[^<]*<\/\1>\s*/g, '');
  // 2) remove demonstration / fictional-property language
  demo.notices.forEach((n) => { html = replaceAll(html, n, ''); });
  html = replaceAll(html, 'Ocean Bluff / Coastal tour', 'the approved reference tour'); // parkland tour dev comment
  // 2b) strip all Credence / Course-System / fictional attribution
  html = stripAttribution(html);
  // 2c) genericise meta descriptions site-wide (template descriptions are demo-specific and can carry strip residue)
  const metaDesc = escapeHtml([model.publicName, model.tagline].filter(Boolean).join(' — '));
  if (metaDesc) {
    html = html.replace(/(<meta name="description" content=")[^"]*(">)/g, '$1' + metaDesc + '$2');
    html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/g, '$1' + metaDesc + '$2');
  }
  // 2d) clean phrase-removal residue + soften 'demonstration' → 'preview' (script/style-safe), then tidy <title>
  html = cleanProse(html);
  html = html.replace(/<title>([\s\S]*?)<\/title>/g, (m, t) => '<title>' + t.replace(/\s{2,}/g, ' ').replace(/\s*[—–-]\s*$/, '').replace(/\s+([.,])/g, '$1').trim() + '</title>');
  // 3) site mode: robots
  if (production) html = html.replace(/<meta name="robots" content="noindex, nofollow">/g, '<meta name="robots" content="index, follow">');
  // (draft keeps the template's existing noindex,nofollow)
  // 4) inject the non-destructive override stylesheet + social footer
  if (!/client-overrides\.css/.test(html)) html = html.replace('</head>', '<link rel="stylesheet" href="client-overrides.css"></head>');
  const soc = socialFooterHtml(social);
  if (soc) html = html.replace('</footer>', soc + '</footer>');
  return html;
}

/* Map client holes.json → the parkland course-tour data array. */
function parklandHolesArray(holesInput) {
  const holes = (holesInput.holes || []).slice().sort((a, b) => a.number - b.number);
  const items = holes.map((h) => {
    const y = h.yardages || {};
    const obj = {
      num: h.number,
      title: h.name || ('Hole ' + h.number),
      par: h.par,
      champ: y.championship || 0,
      member: y.member || 0,
      forward: y.forward || 0,
      hcp: h.strokeIndex || h.number,
      nine: h.nine || (h.number <= 9 ? 'front' : 'back'),
      image: h.image || 'tour-hero.jpg',
      strategy: h.strategy || ''
    };
    return JSON.stringify(obj);
  });
  return 'window.PARKLAND_HOLES = [\n ' + items.join(',\n ') + '\n];';
}

/* Course-tour file per system, and a safe default hole image (a real, non-hole-
   specific template hero used when a hole has no client-supplied image). */
const TOUR_FILE = { coastal: 'tour.html', parkland: 'course-tour.html', desert: 'course-tour.html' };
const TOUR_DEFAULT_IMG = { coastal: 'assets/img/hero-edge.jpg', desert: 'assets/images/home-hero-desert-course.jpg' };

/* Genericise the tour page's meta description (the templates' descriptions name
   demo holes). Title is already handled by identity binding. */
function genericTourMeta(html, model) {
  const name = escapeHtml(model.publicName || 'the course');
  const desc = 'Explore ' + name + ' hole by hole — all eighteen holes, with yardages, stroke index, and the strategy for each.';
  html = html.replace(/(<meta name="description" content=")[^"]*(">)/, '$1' + desc + '$2');
  html = html.replace(/(<meta property="og:description" content=")[^"]*(">)/g, '$1' + desc + '$2');
  return html;
}

function injectCoastalTour(html, holes, model) {
  const def = TOUR_DEFAULT_IMG.coastal;
  const t = totals(holes);
  html = html.replace('<!--CS_SELECTOR-->', coastalSelector(holes));
  html = html.replace('<!--CS_STRIP-->', coastalStrip(holes));
  html = html.replace('<!--CS_PANELS-->', coastalPanels(holes, def));
  html = html.replace('<!--CS_SCORECARD-->', coastalScorecard(holes, model.publicName || 'Course'));
  html = html.replace('<!--CS_SCNOTE-->', 'Par ' + t.parTotal + ' &middot; ' + t.champTotal.toLocaleString() + ' yards from the championship tees.');
  // genericise the demo-routing intro sentence + drop the orphaned ocean-accent legend (generator drops data-ocean)
  html = html.replace(/(<p class="tour-intro"[^>]*>)[\s\S]*?(<\/p>)/, '$1Explore all eighteen holes, from the opening tee to the closing green.$2');
  html = html.replace(/<p class="holes__key">[\s\S]*?<\/p>\s*/, '');
  return genericTourMeta(html, model);
}
function injectDesertTour(html, holes, model) {
  const def = TOUR_DEFAULT_IMG.desert;
  html = html.replace('<!--DS_SELECTOR-->', desertSelector(holes));
  html = html.replace('<!--DS_PANELS-->', desertPanels(holes, def));
  html = html.replace('<!--DS_SCORECARD-->', desertScorecard(holes));
  return genericTourMeta(html, model);
}

/* Remove demo per-hole photography (Ocean Bluff / Canyon House) that the newly
   generated, data-driven tour no longer references. A file is kept only if the
   final HTML still points at its exact relative path (i.e. the client reused the
   same filename), so real client imagery is never deleted. */
function pruneDemoHoleImages(out, system) {
  const htmlText = listFiles(out, ['.html']).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  const relOf = (p) => path.relative(out, p).split(path.sep).join('/');
  const targets = [];
  if (system === 'coastal') {
    const d = path.join(out, 'assets/images/course/holes');
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) targets.push(path.join(d, f));
  } else if (system === 'desert') {
    const d = path.join(out, 'assets/images');
    if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (/^tour-hole-\d+\.(jpg|jpeg|png|webp|avif)$/i.test(f)) targets.push(path.join(d, f));
  }
  let pruned = 0;
  for (const p of targets) { if (!htmlText.includes(relOf(p))) { fs.rmSync(p, { force: true }); pruned++; } }
  if (system === 'coastal') {
    const d = path.join(out, 'assets/images/course/holes');
    if (fs.existsSync(d) && fs.readdirSync(d).length === 0) fs.rmSync(d, { recursive: true, force: true });
  }
  return pruned;
}

function backup(dir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const bak = dir + '.backup-' + stamp;
  fs.renameSync(dir, bak);
  return bak;
}

export function buildClient(slug, opts = {}) {
  const input = loadClient(slug);
  const c = input.client;
  const production = !!opts.production || c.siteMode === 'production';

  // 1) validate — block on errors
  const report = validateClient(slug, { production });
  if (report.errors.length) {
    const e = new Error('Validation failed with ' + report.errors.length + ' error(s). Run "npm run client:validate -- --client ' + slug + '" to see them.');
    e.report = report; throw e;
  }

  const model = buildModel(input);
  const system = c.system;
  const demo = DEMO[system];
  const templateDir = path.join(TEMPLATES_DIR, system);
  if (!fs.existsSync(templateDir)) throw new Error('Template not found: ' + rel(templateDir));

  // 2) resolve + guard output
  const outRaw = opts.output ? path.resolve(REPO_ROOT, opts.output) : path.join(GENERATED_DIR, slug);
  const out = assertSafeOutput(outRaw);
  let backedUp = null;
  if (fs.existsSync(out)) {
    if (!opts.overwrite) throw new Error('Output already exists: ' + rel(out) + '. Re-run with --overwrite to replace it (a timestamped backup is kept).');
    backedUp = backup(out);
  }

  // 3) copy template (skip internal marker files)
  copyDir(templateDir, out, (src) => !/TEMPLATE-README\.txt$/.test(src));

  // 4) overlay client images + logos (only over matching template slots / into images)
  const targetImgDirs = ['assets/images', 'assets/img'].map((d) => path.join(out, d)).filter((d) => fs.existsSync(d));
  const imgDir = targetImgDirs[0] || path.join(out, 'assets/images');
  fs.mkdirSync(imgDir, { recursive: true });
  let imagesCopied = 0;
  if (fs.existsSync(input.imagesDir)) {
    for (const f of fs.readdirSync(input.imagesDir)) {
      if (!/\.(jpg|jpeg|png|webp|avif|mp4|webm)$/i.test(f)) continue;
      // place over any template image dir that already has this filename; else into primary dir
      let placed = false;
      for (const d of targetImgDirs) { if (fs.existsSync(path.join(d, f))) { fs.copyFileSync(path.join(input.imagesDir, f), path.join(d, f)); placed = true; } }
      if (!placed) fs.copyFileSync(path.join(input.imagesDir, f), path.join(imgDir, f));
      imagesCopied++;
    }
  }
  let logosCopied = 0;
  if (fs.existsSync(input.logosDir)) {
    const outLogos = path.join(out, 'assets/logos'); fs.mkdirSync(outLogos, { recursive: true });
    for (const f of fs.readdirSync(input.logosDir)) { if (/\.(svg|png|jpg|jpeg|webp|ico)$/i.test(f)) { fs.copyFileSync(path.join(input.logosDir, f), path.join(outLogos, f)); logosCopied++; } }
  }

  // 5) transform HTML + scrub text assets (CSS/JS) of demo identity & sample data
  const ctx = { system, demo, model, production, social: model.social };
  const htmlFiles = listFiles(out, ['.html']);
  htmlFiles.forEach((f) => { writeText(f, transformHtml(fs.readFileSync(f, 'utf8'), ctx)); });
  const assetsScrubbed = scrubAssets(out, ctx);

  // 5b) inject holes into the Course Tour — all three systems are data-driven
  let holesPruned = 0;
  if (input.holes) {
    const holes = (input.holes.holes || []).slice();
    const tourPath = path.join(out, TOUR_FILE[system]);
    if (fs.existsSync(tourPath)) {
      let h = fs.readFileSync(tourPath, 'utf8');
      if (system === 'parkland') {
        h = h.replace(/window\.PARKLAND_HOLES\s*=\s*\[[\s\S]*?\];/, parklandHolesArray(input.holes));
        h = h.replace('<!--PK_SCORECARD-->', parklandScorecard(holes));
      }
      else if (system === 'coastal') h = injectCoastalTour(h, holes, model);
      else if (system === 'desert') h = injectDesertTour(h, holes, model);
      writeText(tourPath, h);
    }
    // remove demo per-hole photography the generated tour no longer references
    if (system === 'coastal' || system === 'desert') holesPruned = pruneDemoHoleImages(out, system);
    // keep a record of the validated hole data (excluded from the packaged site)
    writeJson(path.join(out, '_client-holes.json'), input.holes);
  }

  // 6) override stylesheet (hides demo chrome, re-anchors sticky header, styles social)
  writeText(path.join(out, 'client-overrides.css'),
    '/* Generated by the Credence client generator — non-destructive client overrides. */\n' +
    ':root{--bar-h:0px}\n' +
    '.demo-bar,.credence-bar,.demo-return{display:none!important}\n' +
    '.mast,.masthead{top:0!important}\n' +
    '/* Long client names must not overflow the mobile masthead (demo names were short). */\n' +
    '.brand{min-width:0}\n' +
    '.brand__wordmark{white-space:normal;overflow-wrap:anywhere}\n' +
    '.brand__name{min-width:0}\n.brand__name b{overflow-wrap:anywhere}\n' +
    '@media (max-width:420px){.brand__wordmark{font-size:.9rem}.brand__name b{font-size:1rem}}\n' +
    '.client-social{display:flex;flex-wrap:wrap;gap:1rem;margin-top:1.2rem;font:600 .8rem/1 system-ui,sans-serif;letter-spacing:.02em}\n' +
    '.client-social a{opacity:.85}\n.client-social a:hover{opacity:1}\n');

  // 7) robots + sitemap by mode
  if (production && model.domain) {
    const origin = model.domain.startsWith('http') ? model.domain.replace(/\/$/, '') : 'https://' + model.domain.replace(/\/$/, '');
    writeText(path.join(out, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + origin + '/sitemap.xml\n');
    const pages = htmlFiles.map((f) => '/' + path.relative(out, f).split(path.sep).join('/')).filter((p) => !/\/_/.test(p));
    const urls = pages.map((p) => '  <url><loc>' + origin + (p === '/index.html' ? '/' : p) + '</loc></url>').join('\n');
    writeText(path.join(out, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + '\n</urlset>\n');
  } else {
    writeText(path.join(out, 'robots.txt'), 'User-agent: *\nDisallow: /\n'); // draft: keep out of search engines
  }

  // 8) build manifest + report
  const tmeta = readJson(path.join(TEMPLATES_DIR, '_meta.json'))[system];
  const manifest = {
    templateSystem: system,
    templateVersion: tmeta.templateVersion,
    generatorVersion: GENERATOR_VERSION,
    buildDate: new Date().toISOString(),
    siteMode: production ? 'production' : 'draft',
    client: { slug, publicName: model.publicName, domain: model.domain }
  };
  writeJson(path.join(out, 'build-manifest.json'), manifest);
  const reportTxt = [
    'CREDENCE CLIENT BUILD REPORT',
    '============================',
    'Client:        ' + slug + '  (' + (model.publicName || 'unnamed') + ')',
    'System:        ' + system + ' (template v' + tmeta.templateVersion + ')',
    'Mode:          ' + (production ? 'PRODUCTION (indexable, sitemap generated)' : 'DRAFT (noindex, robots Disallow)'),
    'Output:        ' + rel(out),
    'HTML pages:    ' + htmlFiles.length,
    'Images copied: ' + imagesCopied,
    'Logos copied:  ' + logosCopied,
    'Holes:         ' + (input.holes ? ('18 holes injected into the data-driven Course Tour' + (holesPruned ? ' (' + holesPruned + ' demo hole image(s) removed)' : '')) : 'not provided (template scaffolding)'),
    'Warnings:      ' + report.warnings.length,
    backedUp ? 'Previous build backed up to: ' + rel(backedUp) : '',
    '',
    'Next: preview locally  ->  npm run client:preview -- --client ' + slug,
    'Then: refine with Claude using client-work/' + slug + '/CLAUDE-PROJECT-PROMPT.md'
  ].filter(Boolean).join('\n');
  writeText(path.join(out, 'BUILD-REPORT.txt'), reportTxt + '\n');

  return { out, manifest, report, htmlCount: htmlFiles.length, imagesCopied, logosCopied, backedUp };
}

/* ---- CLI ---- */
if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client || args._[0];
  if (!slug) { err('Usage: npm run client:build -- --client <slug> [--production] [--output <dir>] [--overwrite]'); process.exit(2); }
  try {
    const r = buildClient(slug, { production: !!args.production, output: args.output, overwrite: !!args.overwrite });
    log('');
    log(color.green(color.bold('✓ Built ' + slug + ' → ' + rel(r.out))));
    log(fs.readFileSync(path.join(r.out, 'BUILD-REPORT.txt'), 'utf8'));
  } catch (e) {
    err(e.message);
    if (e.report) e.report.errors.forEach((m) => log(color.red('  ✖ ' + m)));
    process.exit(1);
  }
}
