#!/usr/bin/env node
/* ============================================================================
   create-client.mjs — scaffold a new client-work folder
   Usage: node client-system/scripts/create-client.mjs --system <coastal|parkland|desert> --slug <slug>
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_WORK_DIR, SYSTEMS, isValidSlug, writeJson, writeText, color, log, err, parseArgs, rel, GENERATOR_VERSION } from '../lib/util.mjs';

/* System-relevant content skeletons (only fields that matter for that system). */
const CONTENT = {
  coastal: {
    hero: { eyebrow: '', headline: '', sub: '' },
    courseOverview: { heading: '', body: '' },
    courseFacts: { holes: 18, par: 72, setting: '', style: '' },
    rates: { heading: '', intro: '', rows: [] },
    events: { heading: '', body: '' },
    grillDining: { heading: '', body: '' },
    golfServices: { heading: '', body: '' },
    lessonsFitting: { heading: '', body: '' },
    outings: { heading: '', body: '' },
    story: { heading: '', body: '' },
    visit: { heading: '', body: '' }
  },
  parkland: {
    hero: { eyebrow: '', headline: '', sub: '' },
    courseOverview: { heading: '', body: '' },
    membership: { heading: '', body: '' },
    ratesTeeTimes: { heading: '', intro: '', rows: [] },
    clubhouseDining: { heading: '', body: '' },
    tournamentsOutings: { heading: '', body: '' },
    instructionPractice: { heading: '', body: '' },
    story: { heading: '', body: '' },
    courseFacts: { holes: 18, par: 72, yards: '', established: '', access: '' }
  },
  desert: {
    hero: { eyebrow: '', headline: '', sub: '' },
    golf: { heading: '', body: '' },
    courseFacts: { holes: 18, par: 72, yards: '', setting: '', experience: '' },
    rates: { heading: '', intro: '', rows: [] },
    courseConditions: { status: '', cartRule: '', practice: '', weather: '' },
    stayLodging: { heading: '', body: '' },
    packages: [],
    dining: { heading: '', body: '' },
    wellness: { heading: '', body: '' },
    groupsEvents: { heading: '', body: '' },
    storyPlace: { heading: '', body: '' }
  }
};

const INTEGRATIONS = {
  coastal: { teeTimesUrl: '', eventsInquiryUrl: '', analyticsId: '' },
  parkland: { teeTimesUrl: '', membershipInquiryUrl: '', eventsInquiryUrl: '', analyticsId: '' },
  desert: { teeTimesUrl: '', lodgingUrl: '', diningReservationUrl: '', eventsInquiryUrl: '', customerPortalUrl: '', analyticsId: '' }
};

const YARDAGE_TEES = { coastal: ['championship', 'member', 'forward'], parkland: ['championship', 'member', 'forward'], desert: ['championship', 'resort', 'forward'] };

function holesSkeleton(system) {
  const tees = YARDAGE_TEES[system];
  const labels = {}; tees.forEach((t) => { labels[t] = t.charAt(0).toUpperCase() + t.slice(1); });
  const holes = [];
  for (let n = 1; n <= 18; n++) {
    const y = {}; tees.forEach((t) => { y[t] = 0; });
    holes.push({ number: n, name: '', par: 4, strokeIndex: n, nine: n <= 9 ? 'front' : 'back', yardages: y, strategy: '', image: '' });
  }
  return { yardageLabels: labels, holes };
}

function claudePrompt(system, slug) {
  return `# Claude project prompt — ${slug} (${system} system)

You are refining a **generated Credence client website**. A working draft has been
built from the protected **${system}** template.

## Where things are
- Client content:  client-work/${slug}/content.json, client.json, holes.json, social.json, integrations.json
- Client images:   client-work/${slug}/images/    (exact documented filenames — see client-system/manifests/${system}.images.json)
- Client logos:    client-work/${slug}/logos/
- Build output:    generated-clients/${slug}/     (or the --output folder used)

## Rules (do not break these)
- Do **not** modify the master templates in \`client-system/templates/\` or the public demos \`/coastal /parkland /desert\`.
- Do **not** modify the Credence root or any other client.
- The only writable target is this client's **output** folder.
- Always run \`npm run client:validate -- --client ${slug}\` **before** building.
- Keep the site in **draft (noindex)** until Ray explicitly approves production.
- Report missing content or images — **never invent** a course's real facts, holes, rates, or photos.

## What to do
1. Validate, then \`npm run client:build -- --client ${slug}\` and \`npm run client:preview -- --client ${slug}\`.
2. Refine client-specific copy and imagery${system === 'coastal' || system === 'desert' ? ' (finalise the Course Tour holes from _client-holes.json in the output — the ' + system + ' tour panels are template scaffolding until you fill them from the client\'s hole data + photography)' : ''}.
3. Test desktop and mobile (320 / 375 / 390 / 430 / 768 / 1024 / 1440): every route, the Course Tour, dialogs, footer, mobile menu, direct hashes, Back/Forward — no console errors, no horizontal overflow.
4. Confirm no demonstration language or fictional-property notices remain, and no other course's name appears.
5. Do **not** deploy production without explicit approval.
`;
}

if (import.meta.url === 'file://' + process.argv[1]) {
  const args = parseArgs(process.argv.slice(2));
  const system = args.system || args._[0];
  const slug = args.slug || args._[1];
  if (!SYSTEMS.includes(system)) { err('Choose a system: --system coastal | parkland | desert'); process.exit(2); }
  if (!isValidSlug(slug)) { err('Provide a safe slug: --slug your-course-name  (lowercase letters, numbers, hyphens; 2–60 chars)'); process.exit(2); }
  const dir = path.join(CLIENT_WORK_DIR, slug);
  if (fs.existsSync(dir)) { err('client-work/' + slug + ' already exists. Choose another slug or edit it in place.'); process.exit(1); }

  ['images', 'logos', 'documents'].forEach((d) => fs.mkdirSync(path.join(dir, d), { recursive: true }));
  fs.writeFileSync(path.join(dir, 'images', '.gitkeep'), '');
  fs.writeFileSync(path.join(dir, 'logos', '.gitkeep'), '');
  fs.writeFileSync(path.join(dir, 'documents', '.gitkeep'), '');

  writeJson(path.join(dir, 'client.json'), {
    system, siteMode: 'draft',
    business: { legalName: '', publicName: '', shortName: '', tagline: '', description: '' },
    domain: '',
    location: { city: '', state: '', country: 'United States' },
    contact: { phone: '', email: '', address: '' },
    branding: { primaryColor: '', secondaryColor: '', accentColor: '' }
  });
  writeJson(path.join(dir, 'content.json'), CONTENT[system]);
  writeJson(path.join(dir, 'integrations.json'), INTEGRATIONS[system]);
  writeJson(path.join(dir, 'social.json'), { instagram: '', facebook: '', tiktok: '', youtube: '' });
  writeJson(path.join(dir, 'holes.json'), holesSkeleton(system));
  writeJson(path.join(dir, 'image-manifest.json'), readManifest(system));
  writeText(path.join(dir, 'CLAUDE-PROJECT-PROMPT.md'), claudePrompt(system, slug));
  writeText(path.join(dir, 'README.md'), readme(system, slug));

  log('');
  log(color.green(color.bold('✓ Created client-work/' + slug + '  (' + system + ' system, draft mode)')));
  log('');
  log('Next steps:');
  log('  1. Fill in ' + color.cyan('client-work/' + slug + '/client.json') + ' and ' + color.cyan('content.json'));
  log('  2. Add hole data to ' + color.cyan('holes.json') + ' (18 holes)');
  log('  3. Add photos to ' + color.cyan('client-work/' + slug + '/images/') + ' and logos to ' + color.cyan('logos/'));
  log('     (see ' + color.cyan('client-system/manifests/' + system + '.images.json') + ' for exact filenames)');
  log('  4. ' + color.cyan('npm run client:validate -- --client ' + slug));
  log('  5. ' + color.cyan('npm run client:build -- --client ' + slug));
  log('  6. ' + color.cyan('npm run client:preview -- --client ' + slug));
  log('');
}

function readManifest(system) {
  try { return readJsonSafe(path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'manifests', system + '.images.json')); }
  catch (e) { return { note: 'see client-system/manifests/' + system + '.images.json', slots: [] }; }
}
function readJsonSafe(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function readme(system, slug) {
  return `# ${slug} — ${system} client (Credence)

This folder holds the **input** for a generated golf-course website. Fill it in,
validate, then build. You never edit HTML for ordinary content.

## Fill these in
| File | What goes here |
| --- | --- |
| \`client.json\` | Business names, domain, city/state, phone, email, address, brand colors. |
| \`content.json\` | Page copy for the ${system} system (hero, sections, rates). |
| \`holes.json\` | 18 holes: number, name, par, stroke index, yardages, strategy, image filename. |
| \`social.json\` | Social links (leave empty to hide). Full page URLs only. |
| \`integrations.json\` | Booking / inquiry / portal links (http(s) only). |
| \`images/\` | Photos, using the exact filenames in \`client-system/manifests/${system}.images.json\`. |
| \`logos/\` | Logo, mark, favicon, Open Graph image. SVG preferred, PNG fallback. |
| \`documents/\` | Private reference material (kept out of the built site). |

## Commands (run from the repository root)
\`\`\`
npm run client:validate -- --client ${slug}
npm run client:build    -- --client ${slug}
npm run client:preview  -- --client ${slug}
npm run client:package  -- --client ${slug} --output ../${slug}-site
\`\`\`

Every new client starts in **draft** mode (\`siteMode: "draft"\` → the site is
\`noindex\`). Switch to production only after approval and a clean validation:
\`npm run client:build -- --client ${slug} --production\`.

See \`client-system/docs/CLIENT-SYSTEM-GUIDE.md\` for the full walkthrough.
`;
}
