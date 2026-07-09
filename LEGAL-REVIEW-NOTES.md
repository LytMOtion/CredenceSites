# Credence — Legal Review Notes (INTERNAL)

**Do not publish this file on the website. Not linked from any page.**

Status: The Website Subscription & Services Agreement (`terms.html`) and the Privacy Policy
(`privacy.html`) are **business drafts pending legal review**. Each file carries an internal
HTML comment: `<!-- DRAFT: ATTORNEY REVIEW REQUIRED BEFORE FINAL CLIENT USE -->` (not visible
to visitors). The pages do **not** claim to be attorney-approved and do not display a large
"not legal advice" banner.

Agreement version / effective date in use: **2026-07-09** (July 9, 2026). The intake form
records `agreement_version = 2026-07-09` plus the acceptance timestamp (`accepted_at`).

## Items requiring a California business-attorney review before final client use

- **Overall agreement** — full review by a California business attorney.
- **Recurring billing language** — setup-fee timing, monthly billing start, taxes, failed-payment
  pause/suspension after reasonable notice (Section 2). No late fees or specific dunning timeline
  were added (not approved).
- **Cancellation language** — written cancellation to hello@credencesites.com, effect at end of
  paid billing period, non-refund except where required by law, site removal on expiry (Section 8).
- **Post-cancellation materials** — no source/template transfer, migration by separate agreement,
  deletion after a "reasonable business-retention period" — no fixed period stated (Section 9).
- **Intellectual-property license** — Credence ownership vs. limited active-subscription license
  (Section 10).
- **Limitation-of-liability clause** — 3-months-fees cap; exclusion of indirect damages (Section 17).
- **Indemnity clause** (Section 18).
- **General provisions** — electronic acceptance, notices, independent contractor, assignment,
  force majeure, severability, waiver, entire agreement, survival (Section 19). **No arbitration
  clause and no prevailing-party attorney-fee clause were added** (not approved).
- **Accessibility language** — WCAG/ADA non-warranty (Section 13).
- **Privacy disclosures** — categories collected, uses, Web3Forms + Vercel + Google Fonts
  processors, retention, user requests, Do Not Track / Global Privacy Control statement.

## Privacy audit findings (as of 2026-07-09)

External requests / processors actually present in the codebase:
- **Vercel** — hosting.
- **Web3Forms** (`api.web3forms.com`) — form submission processing; honeypot (`botcheck`) spam
  protection. No reCAPTCHA is installed.
- **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) — Newsreader + Manrope.

NOT present (confirmed by code audit): Google Analytics, Google Tag Manager, Vercel Analytics,
Vercel Speed Insights, Meta Pixel / fbq, reCAPTCHA, Hotjar, Segment, Intercom, Drift, chat
widgets, and any accessibility/utility widget. All page scripts are self-hosted
(`assets/js/credence-v2.js`; coastal pages also use `assets/app.js` / `data.js`).

**Floating control note:** the floating button seen in the browser preview (assistant / note
tool) is a **browser extension on the reviewer's own device** (visible in the console as
`chrome-extension://…`, e.g. MaxAI / Milanote). It is **not** part of the Credence website, loads
no site code, and is therefore not disclosed in the Privacy Policy and requires no removal from
the site.

Privacy claims deliberately **not** made (unverified): "submissions are never stored," "no IP
address is processed," "all information is encrypted at rest," or "completely secure/confidential."
