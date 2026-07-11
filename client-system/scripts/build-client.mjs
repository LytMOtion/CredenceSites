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
    .replace(/\bfictional\b/gi, '');
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
  // 2) remove demonstration / fictional-property language
  demo.notices.forEach((n) => { html = replaceAll(html, n, ''); });
  html = replaceAll(html, 'Ocean Bluff / Coastal tour', 'the approved reference tour'); // parkland tour dev comment
  // 2b) strip all Credence / Course-System / fictional attribution, then tidy the <title> whitespace
  html = stripAttribution(html);
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

  // 5) transform HTML
  const ctx = { system, demo, model, production, social: model.social };
  const htmlFiles = listFiles(out, ['.html']);
  htmlFiles.forEach((f) => { writeText(f, transformHtml(fs.readFileSync(f, 'utf8'), ctx)); });

  // 5b) inject parkland holes if provided
  if (system === 'parkland' && input.holes) {
    const tour = path.join(out, 'course-tour.html');
    if (fs.existsSync(tour)) {
      let h = fs.readFileSync(tour, 'utf8');
      h = h.replace(/window\.PARKLAND_HOLES\s*=\s*\[[\s\S]*?\];/, parklandHolesArray(input.holes));
      writeText(tour, h);
    }
  }
  // 5c) for coastal/desert, hand the validated hole data to Claude for tour finalisation
  if ((system === 'coastal' || system === 'desert') && input.holes) {
    writeJson(path.join(out, '_client-holes.json'), input.holes);
  }

  // 6) override stylesheet (hides demo chrome, re-anchors sticky header, styles social)
  writeText(path.join(out, 'client-overrides.css'),
    '/* Generated by the Credence client generator — non-destructive client overrides. */\n' +
    ':root{--bar-h:0px}\n' +
    '.demo-bar,.credence-bar,.demo-return{display:none!important}\n' +
    '.mast,.masthead{top:0!important}\n' +
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
    'Holes:         ' + (input.holes ? (system === 'parkland' ? 'injected into course tour' : 'validated; provided to Claude as _client-holes.json for tour finalisation') : 'not provided (template scaffolding)'),
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
