/* ============================================================================
   util.mjs — shared helpers: paths, safety guards, validation primitives, logs
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const GENERATOR_VERSION = '1.0.0';

/* Repo-relative anchors ---------------------------------------------------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CLIENT_SYSTEM_DIR = path.resolve(__dirname, '..');        // /client-system
export const REPO_ROOT = path.resolve(CLIENT_SYSTEM_DIR, '..');        // repo root
export const TEMPLATES_DIR = path.join(CLIENT_SYSTEM_DIR, 'templates');
export const SCHEMAS_DIR = path.join(CLIENT_SYSTEM_DIR, 'schemas');
export const MANIFESTS_DIR = path.join(CLIENT_SYSTEM_DIR, 'manifests');
export const CLIENT_WORK_DIR = path.join(REPO_ROOT, 'client-work');
export const GENERATED_DIR = path.join(REPO_ROOT, 'generated-clients');

export const SYSTEMS = ['coastal', 'parkland', 'desert'];

/* PROTECTED paths — the generator must NEVER write inside these.
   The three approved public demonstrations are frozen reference implementations. */
export const PROTECTED_DIRS = [
  path.join(REPO_ROOT, 'coastal'),
  path.join(REPO_ROOT, 'parkland'),
  path.join(REPO_ROOT, 'desert'),
];
/* Credence root files that must never be a client output target. */
export const PROTECTED_ROOT_FILES = ['index.html', 'start.html', 'intake.html', 'approval.html', 'terms.html', 'privacy.html', 'billing.html', 'payment-confirmed.html', 'payment-canceled.html', 'robots.txt', 'sitemap.xml'];

/* Colored, dependency-free logging ---------------------------------------- */
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const C = (code) => (s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const color = { red: C('31'), green: C('32'), yellow: C('33'), blue: C('34'), gray: C('90'), bold: C('1'), cyan: C('36') };
export function log(msg = '') { process.stdout.write(msg + '\n'); }
export function err(msg) { process.stderr.write(color.red('✖ ' + msg) + '\n'); }

/* Slug: safe lowercase letters, numbers, single hyphens ------------------- */
export function isValidSlug(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 2 && slug.length <= 60;
}

/* PATH SAFETY -------------------------------------------------------------
   Resolve a candidate output path and abort if it falls inside any protected
   directory (a master demonstration or the Credence root pages). */
export function assertSafeOutput(outputPath) {
  const resolved = path.resolve(outputPath);
  for (const p of PROTECTED_DIRS) {
    if (resolved === p || resolved.startsWith(p + path.sep)) {
      throw new Error('REFUSED: output path resolves inside a protected master demonstration (' + rel(p) + '). A client build may never write into /coastal, /parkland, or /desert.');
    }
  }
  // Refuse writing directly over a Credence root file / the repo root itself.
  if (resolved === REPO_ROOT) throw new Error('REFUSED: output path is the Credence repository root.');
  const base = path.basename(resolved);
  if (path.dirname(resolved) === REPO_ROOT && PROTECTED_ROOT_FILES.includes(base)) {
    throw new Error('REFUSED: output path would overwrite a protected Credence root file (' + base + ').');
  }
  return resolved;
}

export function rel(p) { return path.relative(REPO_ROOT, p) || '.'; }

/* JSON helpers ------------------------------------------------------------ */
export function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try { return JSON.parse(raw); }
  catch (e) { throw new Error('Invalid JSON in ' + rel(file) + ': ' + e.message); }
}
export function tryReadJson(file) { try { return { ok: true, data: readJson(file) }; } catch (e) { return { ok: false, error: e.message }; } }
export function writeJson(file, obj) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n'); }
export function writeText(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }

/* Recursive copy of a directory tree (files + subdirs). */
export function copyDir(src, dest, filter) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name), d = path.join(dest, entry.name);
    if (filter && !filter(s, entry)) continue;
    if (entry.isDirectory()) copyDir(s, d, filter);
    else fs.copyFileSync(s, d);
  }
}

export function listFiles(dir, ext) {
  const out = [];
  (function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (!ext || ext.includes(path.extname(e.name).toLowerCase())) out.push(p);
    }
  })(dir);
  return out;
}

/* URL validation ---------------------------------------------------------- */
export function urlKind(u) {
  if (typeof u !== 'string' || u.trim() === '') return 'empty';
  const s = u.trim();
  if (s === '#') return 'placeholder';
  let parsed;
  try { parsed = new URL(s); } catch (e) { return 'invalid'; }
  if (parsed.protocol === 'javascript:') return 'unsafe';
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return 'invalid';
  // generic platform homepages (warn)
  const host = parsed.hostname.replace(/^www\./, '');
  const genericHosts = ['instagram.com', 'facebook.com', 'tiktok.com', 'youtube.com', 'x.com', 'twitter.com'];
  if (genericHosts.includes(host) && (parsed.pathname === '/' || parsed.pathname === '')) return 'generic';
  return 'ok';
}

export function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) { args[key] = true; }
      else { args[key] = next; i++; }
    } else args._.push(a);
  }
  return args;
}
