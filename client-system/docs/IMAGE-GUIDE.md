# Image Guide

Place client photos in `client-work/<slug>/images/` and brand assets in
`client-work/<slug>/logos/`. Use the **exact filenames** documented for the
chosen system in `client-system/manifests/<system>.images.json`.

## How image replacement works
The build copies the template's photos into the client site, then **overlays any
image you provide with a matching filename**. So:
- Provide `home-hero-fairway.jpg` (Parkland) or `hero-edge.jpg` (Coastal) or
  `home-hero-desert-course.jpg` (Desert) to replace the home hero.
- Any file you don't provide keeps the template photo (a clearly-marked reference
  image) until you add the real one.

## Requirements
| Item | Guidance |
| --- | --- |
| Formats | `jpg`, `jpeg`, `png`, `webp`, `avif`. Video only for approved slots: `mp4`, `webm`. |
| Home hero | ~16:9, **≥ 2000px wide**. Keep the key feature (fairway/green/architecture) centred. |
| Section / tour images | ~16:9 or 3:2, ≥ 1280px wide. |
| Mobile subject | Keep the important subject near the centre so responsive crops don't cut it. |
| Alt text | Add descriptive `altText` in the manifest (needed for accessibility / production). |

## Validation reports
`npm run client:validate` flags: missing required image, unsupported format,
wrong/unknown filename (unused), and (in production) missing alt text.

## What NOT to do
- Don't upload images to any external service — everything stays local.
- Don't rename template slots; use the documented filenames so the overlay works.
