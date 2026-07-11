# Credence Client System — architecture

A protected, repeatable system that generates a **standalone golf-course website**
for a new client from one of the three approved Course Systems, without ever
modifying the approved masters.

## Chosen architecture (and why)

**Static HTML + a tiny, zero-dependency Node generator with explicit named data
bindings.** No framework, no database, no CMS, no build step for the client sites.

Why this approach:
- **Preserves the approved work exactly.** The generated sites are the same static
  HTML/CSS/JS as the approved Course Systems — identical visuals, responsiveness,
  and interactions (including the recent Parkland and Desert Course Tour fixes).
- **Vercel-static compatible.** A generated site is plain files; it deploys to any
  static host with no server or secrets.
- **Safe and predictable.** Client content comes from **named data bindings**
  (`client.json`, `content.json`, `holes.json`, …) applied to a copy of a frozen
  template — not fragile global search-and-replace of arbitrary text. The only
  string replacements are the **canonical named identity entities** (the course's
  own name/wordmark) and clearly-scoped Credence/Course-System attribution, which
  never occur in a real client's content.
- **No new dependencies.** The renderer (`lib/render.mjs`), schema validator
  (`lib/schema.mjs`), and safety helpers (`lib/util.mjs`) are all hand-written and
  dependency-free, so there is nothing to install and nothing to audit.

## Directory map
```
client-system/
  lib/        render.mjs, schema.mjs, util.mjs, model.mjs   (engine + safety)
  templates/  coastal/ parkland/ desert/  _meta.json        (FROZEN template sources)
  schemas/    client / content(per-system) / holes / social / integrations / image-manifest
  manifests/  <system>.images.json                          (image slot documentation)
  examples/   coastal-example / parkland-example / desert-example
  scripts/    create-client, validate-client, build-client, preview-client, package-client
  docs/       CLIENT-SYSTEM-GUIDE, IMAGE-GUIDE, CONTENT-GUIDE, DEPLOYMENT-GUIDE, CLAUDE-WORKFLOW
client-work/        <- your per-client INPUT (gitignored; may hold private info)
generated-clients/  <- built sites (gitignored)
```

## Protection model
- `client-system/templates/` are independent, frozen copies used only for reading.
- The public demos `/coastal /parkland /desert` are never read-for-edit or written.
- `lib/util.mjs → assertSafeOutput()` refuses any output path inside a master
  demonstration or over a Credence root file. The build/package abort with a clear
  error rather than risk the approved work.
- Every new client starts in **draft** (`noindex`); production requires an explicit
  flag and a clean production validation.

See `docs/CLIENT-SYSTEM-GUIDE.md` for the full step-by-step workflow.
