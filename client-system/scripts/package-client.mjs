#!/usr/bin/env node
/* ============================================================================
   package-client.mjs — export a clean, deploy-ready copy of a built client site
   Usage: node client-system/scripts/package-client.mjs --client <slug> --output <dir> [--production] [--overwrite]
   The package contains ONLY what the client site needs — no generator scripts,
   no templates, no other clients, no private documents, no repo git history.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { buildClient } from './build-client.mjs';
import { GENERATED_DIR, REPO_ROOT, assertSafeOutput, copyDir, writeText, readJson, color, log, err, parseArgs, rel } from '../lib/util.mjs';

/* Files that are internal to the generation process and must NOT ship. */
const EXCLUDE = new Set(['_client-holes.json', 'BUILD-REPORT.txt']);

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client || args._[0];
  if (!slug || !args.output) { err('Usage: npm run client:package -- --client <slug> --output <dir> [--production]'); process.exit(2); }
  const built = path.join(GENERATED_DIR, slug);
  if (!fs.existsSync(built) || args.production) { log(color.gray('Building ' + (args.production ? 'production' : 'draft') + ' before packaging…')); buildClient(slug, { production: !!args.production, overwrite: true }); }

  const dest = assertSafeOutput(path.resolve(REPO_ROOT, args.output));
  if (fs.existsSync(dest)) {
    if (!args.overwrite) { err('Package destination exists: ' + rel(dest) + '. Re-run with --overwrite.'); process.exit(1); }
    fs.rmSync(dest, { recursive: true, force: true });
  }
  copyDir(built, dest, (src) => !EXCLUDE.has(path.basename(src)));

  const manifest = readJson(path.join(built, 'build-manifest.json'));
  writeText(path.join(dest, 'DEPLOY-README.md'),
`# ${slug} — deploy package

A standalone, static ${manifest.templateSystem} golf-course website.
Mode: **${manifest.siteMode}**${manifest.siteMode === 'draft' ? '  (noindex — safe to deploy for review, will not be indexed)' : ''}.

## Deploy (Ray's steps)
1. Create a **new, empty GitHub repository** for this client (do not push into the Credence repo).
2. From this folder:
   \`\`\`
   git init && git add -A && git commit -m "Initial ${slug} site"
   git branch -M main
   git remote add origin <the-new-repo-url>
   git push -u origin main
   \`\`\`
3. In Vercel, **Add New → Project**, import the new repo, deploy (framework preset: *Other*, root directory: *./*).
4. Connect the client's domain **only after approval**.

This is a static site — no build step, no server, no database, no secrets.
Do not connect credencesites.com or any Credence domain to it.
`);
  // Minimal Vercel static config (harmless, optional).
  writeText(path.join(dest, 'vercel.json'), JSON.stringify({ cleanUrls: false, trailingSlash: false }, null, 2) + '\n');

  log('');
  log(color.green(color.bold('✓ Packaged ' + slug + ' → ' + rel(dest))));
  log(color.gray('  Ready to push to its own new GitHub repo and its own Vercel project (see DEPLOY-README.md).'));
  log('');
}
