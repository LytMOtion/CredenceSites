# Credence Client System — complete guide

This is the beginner's walkthrough for turning one of the three approved Credence
Course Systems (Coastal, Parkland, Desert) into a **new, standalone golf-course
website for a paying client** — without ever touching the approved masters.

You do this from **Terminal** (and, for polish, **Claude Cowork**). You never edit
HTML for ordinary content — you fill in labelled data files and run commands.

> **The golden rule:** the generator only *reads* templates and *writes* to a
> separate output folder. It will refuse to write into `/coastal`, `/parkland`,
> `/desert`, or the Credence root.

---

## What you need once
- A Mac with **Node.js 18+** installed (check with `node --version`).
- This repository on your computer.
- A code editor (VS Code is fine) to edit the JSON data files.

No database, no server, no accounts, no secrets.

---

## The 15 steps

### STEP 1 — Open Terminal
Open the **Terminal** app.

### STEP 2 — Go to the Credence repository
```
cd ~/Documents/GitHub/CredenceSites
```
(Use the real path to your copy of this repo.)

### STEP 3 — Create a new client package
Pick the system that best fits the course and give it a **slug** (lowercase
letters, numbers, hyphens — e.g. `pine-valley-club`):
```
npm run client:new -- --system parkland --slug pine-valley-club
```
Or use the friendly wrapper, which asks you questions:
```
./new-client.sh
```
This creates `client-work/pine-valley-club/` with empty data files.

### STEP 4 — Open the client-work folder
Open `client-work/pine-valley-club/` in your editor. You'll see:
`client.json`, `content.json`, `holes.json`, `social.json`, `integrations.json`,
and folders `images/`, `logos/`, `documents/`, plus a `README.md`.

### STEP 5 — Add course information
- `client.json` — names, domain, city/state, phone, email, address, brand colours.
- `content.json` — the page copy for that system (hero, sections, rates).
See **CONTENT-GUIDE.md** for exactly what each field means.

### STEP 6 — Add images and logos
- Put photos in `images/` using the **exact filenames** listed in
  `client-system/manifests/<system>.images.json`.
- Put the logo, mark, favicon, and Open Graph image in `logos/`.
See **IMAGE-GUIDE.md** for sizes and crops.

### STEP 7 — Run validation
```
npm run client:validate -- --client pine-valley-club
```
You'll get **ERRORS** (block a build), **WARNINGS** (fine for a draft), and
**PASSED CHECKS**.

### STEP 8 — Fix errors and warnings
Edit the JSON files and re-run STEP 7 until there are no errors.
The validator never invents content — it tells you what's missing.

### STEP 9 — Build the website
```
npm run client:build -- --client pine-valley-club
```
This creates a complete site in `generated-clients/pine-valley-club/` in **draft**
mode (search engines are blocked until you go to production).

### STEP 10 — Preview locally
```
npm run client:preview -- --client pine-valley-club
```
Open the `http://localhost:4321/` URL it prints. **Press Ctrl+C** in Terminal to
stop the server when you're done.

### STEP 11 — Use the generated Claude prompt for refinement
Open `client-work/pine-valley-club/CLAUDE-PROJECT-PROMPT.md`, copy it, and paste it
into **Claude Cowork**. Claude will refine client-specific copy and imagery and
(for Coastal/Desert) finalise the Course Tour holes — always keeping the site in
draft and never touching the masters. See **CLAUDE-WORKFLOW.md**.

### STEP 12 — Package the site
Create a clean, deploy-ready copy **outside** this repo:
```
npm run client:package -- --client pine-valley-club --output ../pine-valley-club-site
```

### STEP 13 — Create a new GitHub repository
Make a **new, empty** repository for this client (not inside the Credence repo).
Then, inside the packaged folder, follow its `DEPLOY-README.md`.

### STEP 14 — Deploy to a separate Vercel project
In Vercel: **Add New → Project**, import the client's new repo, deploy
(framework preset *Other*, root directory `./`). The draft site is safe to deploy
for review — it stays `noindex`.

### STEP 15 — Connect the client domain only after approval
Once the client approves, switch to production and connect their domain:
```
npm run client:build -- --client pine-valley-club --production
```
Never connect credencesites.com or any Credence domain to a client site.

---

## What NOT to edit
- `/coastal`, `/parkland`, `/desert` — the approved public demonstrations (frozen).
- `client-system/templates/` — the protected template sources.
- The Credence root pages (`index.html`, `billing.html`, etc.).
- Another client's folder.

## Making a backup
Everything you type lives in `client-work/<slug>/`. To back it up, copy that
folder somewhere safe. Generated sites can always be rebuilt from it.

## Correcting content / replacing an image / rebuilding
1. Edit the JSON (or drop a new image with the same filename into `images/`).
2. `npm run client:validate -- --client <slug>`
3. `npm run client:build -- --client <slug> --overwrite`  *(a timestamped backup of the previous build is kept)*
4. `npm run client:preview -- --client <slug>`

## Updating an existing client later
See **DEPLOYMENT-GUIDE.md → "Updating an existing client"**. In short: edit the
JSON, rebuild to a temporary folder, compare, then replace the files in the
client's own repository and let the client's own Vercel project deploy.

## Commands at a glance
```
npm run client:new      -- --system <coastal|parkland|desert> --slug <slug>
npm run client:validate -- --client <slug> [--production]
npm run client:build    -- --client <slug> [--production] [--output <dir>] [--overwrite]
npm run client:preview  -- --client <slug> [--port 4321]
npm run client:package  -- --client <slug> --output <dir> [--production]
npm run template:compare -- --system <coastal|parkland|desert>   (read-only drift report)
```

---

## UPDATING A PROTECTED TEMPLATE

The generator builds client sites from **frozen copies** of the three Course
Systems that live in `client-system/templates/`. These template copies are
*deliberately independent* from the public master demonstrations at `/coastal`,
`/parkland`, and `/desert`.

**Improving a public master does NOT update the generator.** If you polish
`/desert` — fix a bug, refine the type, adjust a layout — that change lands only
in the public demo. `client-system/templates/desert/` is untouched, and every
future client build still uses the old template. This is intentional: it keeps
approved client work stable and prevents a demo edit from silently changing (or
breaking) the generator or an existing client's site.

There is **no automatic sync**, and there will not be one. An "apply changes from
the master" button could overwrite protected template work or quietly alter sites
that have already shipped to clients. Folding an improvement in is always a
deliberate, reviewed act.

### See what has drifted (read-only)
```
npm run template:compare -- --system desert
```
This prints which files differ between `client-system/templates/desert` and the
public `/desert` master. It **never writes, copies, or syncs anything** — it is a
review aid only. (Expect the Course-Tour file to always show as "changed": the
template carries the generator's data-injection markers, which the master does
not.)

### If an approved improvement *should* become part of the generator
Do it intentionally, in this order:

1. **Confirm the change is approved** on the public master and is the version you
   want every future client to inherit.
2. **Record the source commit.** Note the git commit of `/<system>` you are
   copying from, in your commit message and in `templates/_meta.json`
   (add/update a `sourceCommit` field for that system).
3. **Copy the specific files intentionally** into
   `client-system/templates/<system>/` — never a blanket folder copy, and never
   over the data-injection markers in the Course-Tour file (re-insert them if you
   replace that file).
4. **Increment the template version** for that system in
   `client-system/templates/_meta.json` (`templateVersion`, e.g. `1.0.0` → `1.1.0`).
   The version is written into every future build's `build-manifest.json`, so you
   can always tell which template a client site was built from.
5. **Rebuild all three test clients** and **re-run the visual QA**
   (320 / 375 / 390 / 430 / 768 / 1024 / 1440 — every route, the Course Tour,
   dialogs, footer, mobile menu, direct hashes, Back/Forward): a template change
   can affect any system, so all three are re-verified, not just the one you touched.
6. **Existing client sites are NOT auto-updated.** They keep the template version
   they were built with. To move an existing client onto the new template, rebuild
   that client from its `client-work/<slug>/` inputs into a temporary folder,
   compare, and only then replace the files in the client's own repository.
