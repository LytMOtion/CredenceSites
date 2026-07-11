# Deployment Guide

Each client site lives in its **own** GitHub repository and its **own** Vercel
project. Never deploy a client from the Credence repo, and never connect a
Credence domain to a client.

## First deployment
1. `npm run client:package -- --client <slug> --output ../<slug>-site`
2. In `../<slug>-site` (see its `DEPLOY-README.md`):
   ```
   git init && git add -A && git commit -m "Initial <slug> site"
   git branch -M main && git remote add origin <NEW-REPO-URL> && git push -u origin main
   ```
3. Vercel → **Add New → Project** → import the new repo → deploy
   (framework preset *Other*, root directory `./`).
4. The **draft** site is `noindex` — safe to share for review.
5. After approval: `npm run client:build -- --client <slug> --production`, repackage,
   push, and (only now) connect the client's domain in Vercel.

## Draft vs production
- **Draft** (default): every page `noindex, nofollow`, `robots.txt` disallows all,
  no `sitemap.xml`. Deploying to Vercel does **not** make it indexable.
- **Production**: pages become `index, follow`, `robots.txt` allows all, and a
  `sitemap.xml` is generated from the client's domain. Production is only allowed
  after `client:validate --production` passes with **zero errors** (domain, public
  name, contact, required images, titles/descriptions, valid integrations, and no
  demonstration/placeholder language).

## Updating an existing client later
1. Edit the client's JSON (or replace an image with the same filename).
2. `npm run client:validate -- --client <slug>`
3. Rebuild into a **temporary** folder to compare:
   `npm run client:build -- --client <slug> --output ../<slug>-review --overwrite`
4. Review the changes locally.
5. After approval, copy the changed files into the client's own repository (or
   re-package and replace), commit **to the client's repo**, and let the client's
   own Vercel project deploy.
6. Ordinary text, pricing, hours, links, and image changes never require editing
   generated HTML — change the JSON and rebuild.

## Exceptional custom design (overrides)
For rare client-specific design tweaks that the data files can't express, use:
```
client-work/<slug>/overrides/custom.css
client-work/<slug>/overrides/custom.js
client-work/<slug>/overrides/custom-content.html
```
Keep ordinary content changes in the JSON — overrides are only for genuine
one-off design needs, and are applied on top of the template without editing it.
