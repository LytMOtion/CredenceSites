#!/usr/bin/env node
/* ============================================================================
   preview-client.mjs — build (if needed) and serve a client site locally
   Usage: node client-system/scripts/preview-client.mjs --client <slug> [--port 4321] [--production]
   Stop the server with Ctrl+C.  (No file:// — a real local HTTP server.)
   ============================================================================ */
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { buildClient } from './build-client.mjs';
import { GENERATED_DIR, color, log, err, parseArgs, rel } from '../lib/util.mjs';

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain' };

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.client || args._[0];
  if (!slug) { err('Usage: npm run client:preview -- --client <slug> [--port 4321]'); process.exit(2); }
  const out = path.join(GENERATED_DIR, slug);
  if (!fs.existsSync(out)) { log(color.gray('No build found — building draft first…')); buildClient(slug, { production: !!args.production }); }
  const port = parseInt(args.port, 10) || 4321;
  const root = out;
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0].split('#')[0]);
    let fp = path.join(root, u);
    try { if (fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html'); } catch (e) { res.writeHead(404); return res.end('404'); }
    fs.readFile(fp, (e, d) => {
      if (e) { res.writeHead(404); return res.end('404 Not Found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp).toLowerCase()] || 'application/octet-stream' });
      res.end(d);
    });
  });
  server.listen(port, () => {
    log('');
    log(color.green(color.bold('▶ Serving ' + slug + '  →  ') + color.cyan('http://localhost:' + port + '/')));
    log(color.gray('  Root: ' + rel(root)));
    log(color.gray('  Open the URL above in your browser. Press Ctrl+C to stop the server.'));
    log('');
  });
  process.on('SIGINT', () => { log('\n' + color.gray('Server stopped.')); server.close(() => process.exit(0)); });
}
