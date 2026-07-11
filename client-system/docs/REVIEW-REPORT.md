# Credence billing & client-generator — review report

This documents the verification of the Credence billing shell and the protected,
repeatable client-site generator, including the completion of **data-driven
Course Tours for all three systems**. Nothing in this work modifies the public
master demonstrations (`/coastal`, `/parkland`, `/desert`), merges to `main` or
`course-systems-integration`, or connects a real payment processor or domain.

## What changed this round
- **Coastal and Desert Course Tours are now fully data-driven from `holes.json`**,
  matching the approved Parkland approach. All three systems can now generate a
  complete 18-hole client site with no hand-editing of generated HTML.
  - `client-system/lib/tour.mjs` renders each system's selector, 18 hole panels,
    and scorecard from `holes.json`, preserving each approved layout and JS engine
    (Coastal `app.js`, Desert `desert.js`, Parkland `parkland.js`).
  - The two protected tour templates carry data-injection markers; the build fills
    them, **computes scorecard totals from the hole data**, and prunes demo hole
    photography (Ocean Bluff / Canyon House) that the new tour no longer references.
- **Validation** (`validate-client.mjs`) now rejects/reports: missing or duplicate
  hole numbers, holes outside 1–18, missing names, implausible par, non-numeric
  yardages (all tees), wrong front/back assignment, non-unique/incomplete stroke
  index, missing hole image, missing production alt text, and any mismatch between
  a declared scorecard total and the calculated total. Client golf data is never
  silently altered.
- **Demo-language hygiene**: identity binding (incl. uppercase SVG labels),
  attribution stripping, CSS/JS asset scrubbing, and a script/style-safe prose
  cleanup remove Ocean Bluff / Alderwick / Canyon House / "Course System 0X" /
  "by Credence" / "fictional" / placeholder image captions, and repair removal
  residue (double spaces, orphaned punctuation, emptied notes).
- **Template maintenance**: `npm run template:compare -- --system <s>` prints a
  read-only drift report vs. the public master. It never syncs. Docs add
  "UPDATING A PROTECTED TEMPLATE" (intentional, versioned updates; existing client
  sites never auto-updated).

## Test clients (fictional, distinct, gitignored inputs)
Four realistic clients were authored and built, each with a distinct name,
location, contact, rates, socials, integrations, and a unique 18-hole routing:
- `cedar-ridge-golf-club` — Cedar Ridge Golf Club (Parkland, Fenwick CT)
- `coastal-test-course` — Windward Dunes Golf Links (Coastal, Cape Alder OR)
- `parkland-test-club` — Sherwood Hollow Country Club (Parkland, Marysburg OH)
- `desert-test-resort` — Saguaro Vista Golf Resort (Desert, Vista Verde AZ)

None uses Ocean Bluff / Alderwick / Canyon House or any real course identity.

## Verification results
- **Brand / demo scan** across all four generated sites (HTML/CSS/JS): **0**
  occurrences of Ocean Bluff, Alderwick, Canyon House, "Course System 0X",
  "by Credence", "fictional", "demonstration", or placeholder image captions.
- **Scorecard arithmetic**: displayed Out / In / Total equal the calculated hole
  totals for every system (e.g. Windward Dunes 36·3,424 / 36·3,526 / Par 72 · 6,950).
- **Responsive QA** (headless Chromium at 320 / 375 / 390 / 430 / 768 / 1024 /
  1440): **no horizontal overflow** on any page of any client after fixing a
  long-client-name masthead overflow at 320 px (a generation-only issue; masters
  were unaffected). No demo-removal artifacts (no empty wrappers, lone border
  bars, double spaces, or orphaned legends).
- **Course Tour engine** (Coastal & Desert): hole selection, `#hole-N` hash,
  Back/Forward, prev/next, all-holes, deep-link `#hole-12`, and the scorecard
  modal all function. Parkland tours drive from `window.PARKLAND_HOLES` and update
  the hash on selection. The only console messages are external Google-Fonts
  requests blocked by the offline QA sandbox — not a site defect.
- **Packaging**: `cedar-ridge-golf-club` packaged to a standalone folder contains
  only the site (HTML/CSS/JS/images/logos + `robots.txt`, `vercel.json`,
  `DEPLOY-README.md`, `build-manifest.json`). It contains **no** generator code,
  templates, other clients, `_client-holes.json`, build report, git history, or
  billing config. Served standalone, every route returns 200 and the tour renders
  the client's 18 holes.

## Protection & safety confirmations
- Public masters `/coastal`, `/parkland`, `/desert` are byte-for-byte unchanged
  (clean `git status`); only `client-system/templates/**` were edited.
- Every client starts in **draft** (`robots: Disallow`, `noindex`); production
  requires an explicit flag and a clean production validation.
- Billing config stays empty; no payment processor, no real domain, no secrets.
- No merge to `main` or `course-systems-integration`; no `vercel --prod`.
