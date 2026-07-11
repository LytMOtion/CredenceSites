# Claude Workflow

Every generated client folder includes a ready-made **CLAUDE-PROJECT-PROMPT.md**.
Open Claude Cowork and paste it. It tells Claude exactly which template, which
client folder, and which output to use — and the hard safety rules.

## What Claude should do
1. `npm run client:validate -- --client <slug>` first — fix reported issues; never invent facts.
2. `npm run client:build -- --client <slug>` then `npm run client:preview -- --client <slug>`.
3. Refine client-specific copy and imagery.
   - **Coastal / Desert**: finalise the Course Tour holes. The build validates the
     client's `holes.json` and writes it to `generated-clients/<slug>/_client-holes.json`.
     Use it to fill the Coastal/Desert per-hole panels and photography (their tour
     markup ships as scaffolding until finalised). *(Parkland's tour is fully
     data-driven from `holes.json` automatically.)*
4. QA desktop + mobile (320/375/390/430/768/1024/1440): every route, the Course
   Tour, dialogs, footer, mobile menu, direct `#hole-N` hashes, Back/Forward — no
   console errors, no horizontal overflow, no clipped content.
5. Confirm no demonstration language, no fictional-property notices, and no other
   course's name remain.

## Hard rules for Claude (never break)
- Do **not** edit `client-system/templates/` or `/coastal /parkland /desert`.
- Do **not** edit the Credence root or another client.
- Only writable target: this client's output folder.
- Keep the site **draft (noindex)** until Ray explicitly approves production.
- Do **not** deploy production without explicit approval.
- Report missing content/images — do not fabricate a course's real data or photos.

## Bringing template improvements into an existing client (future)
Template versions are recorded in `generated-clients/<slug>/build-manifest.json`
(`templateVersion`) and `client-system/templates/_meta.json`. If a master template
is improved and its version is bumped, a client is **not** updated automatically.
To adopt improvements: rebuild the client from its `client-work` inputs on the new
template version into a temporary folder, diff against the client's current site,
and merge intentionally. v1 deliberately avoids automatic mass updates.
