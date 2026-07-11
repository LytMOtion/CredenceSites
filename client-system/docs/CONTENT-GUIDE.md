# Content Guide

You never edit HTML for ordinary content. You fill in JSON files. Empty values are
fine for a **draft** (they produce warnings); they are required for **production**.

## `client.json`
- `system` — coastal | parkland | desert (set by `client:new`).
- `siteMode` — `draft` (noindex) or `production`. Start with **draft**.
- `business.publicName` — the course name shown across the site (**required**).
- `business.shortName` — a shorter form used in the header wordmark.
- `business.legalName` — internal only; not displayed publicly.
- `business.tagline`, `business.description` — short marketing lines.
- `domain` — e.g. `pinevalley.com` (required for production + sitemap).
- `location.city`, `location.state`, `location.country`.
- `contact.phone`, `contact.email`, `contact.address`.
- `branding.primaryColor` / `secondaryColor` / `accentColor` — optional hex colours.

## `content.json` (per system)
Each system exposes only the sections that make sense for it:
- **Coastal**: hero, courseOverview, courseFacts, rates, events, grillDining,
  golfServices, lessonsFitting, outings, story, visit.
- **Parkland**: hero, courseOverview, membership, ratesTeeTimes, clubhouseDining,
  tournamentsOutings, instructionPractice, story, courseFacts.
- **Desert**: hero, golf, courseFacts, rates, courseConditions, stayLodging,
  packages, dining, wellness, groupsEvents, storyPlace.
`hero.headline` is required. Everything else falls back to template scaffolding
in draft and should be filled before production.

## `holes.json` (all systems)
18 holes. Each: `number`, `name`, `par`, `strokeIndex`, `nine` (front/back),
`yardages` (system tees — Coastal/Parkland: championship/member/forward; Desert:
championship/resort/forward), `strategy`, optional `image` (a filename in images/).
Validation checks holes 1–18 exist, no duplicates, plausible pars, numeric
yardages, and that the **scorecard total is arithmetically correct**. Client golf
data is never silently changed — inconsistencies are reported.

## `social.json`
Full page URLs only (`https://instagram.com/yourcourse`). Empty = the link is
hidden. Generic platform homepages are flagged.

## `integrations.json`
Booking / inquiry / portal links. Only `http(s)` URLs are accepted; `javascript:`
and `#` are rejected. Analytics only if the client provides an approved ID.
