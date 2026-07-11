/* ============================================================================
   model.mjs — load a client's input files and build the render/transform model
   ============================================================================
   Named data bindings only. The build applies these bindings to a copy of the
   chosen template; it never edits a master demonstration.
   ============================================================================ */
import fs from 'node:fs';
import path from 'node:path';
import { CLIENT_WORK_DIR, readJson, tryReadJson } from './util.mjs';

/* Exact demo identity strings per system (the canonical named entities we bind). */
export const DEMO = {
  coastal: {
    full: 'Ocean Bluff National Golf Club',
    wordmark: 'Ocean Bluff <span>National</span>',
    name2: 'Ocean Bluff National',
    short: 'Ocean Bluff',
    csLabel: 'Course System 01 — The Coastal',
    location: 'California Coast',
    phone: '(805) 555-0148',
    bars: ['demo-return'],
    header: '.masthead',
    notices: [
      'Ocean Bluff National Golf Club is a fictional demonstration property created to present Credence Course System 01 — The Coastal. No real bookings, purchases, memberships, inquiries, or reservations are processed. All rates, menus, events, and details shown are fictional sample content.',
      'Ocean Bluff National Golf Club is a fictional demonstration property created to present Credence Course System 01 — The Coastal. No real bookings, purchases, memberships, inquiries, or reservations are processed.'
    ]
  },
  parkland: {
    full: 'Alderwick Golf Club',
    wordmark: '<b>Alderwick</b><span>Golf Club</span>',
    name2: 'Alderwick Golf Club',
    short: 'Alderwick',
    csLabel: 'Course System 02 — The Parkland',
    location: '',
    phone: '',
    bars: ['demo-bar'],
    header: '.mast',
    notices: [
      'Fictional demonstration property with sample content and reference imagery.',
      'A fictional demonstration property presenting Course System 02 — The Parkland by Credence.',
      'Alderwick Golf Club is a fictional demonstration property. Course details, rates, services, imagery, history, booking paths, and operational information are sample content created to demonstrate Course System 02 — The Parkland by Credence.'
    ]
  },
  desert: {
    full: 'Canyon House Golf Club',
    wordmark: '<b>Canyon House</b><span>Golf Club</span>',
    name2: 'Canyon House Golf Club',
    short: 'Canyon House',
    csLabel: 'Course System 03 — The Desert',
    location: '',
    phone: '',
    bars: ['credence-bar'],
    header: '.masthead',
    notices: [
      'Fictional demonstration property with sample content and reference imagery.',
      'Canyon House Golf Club is a fictional demonstration property. Course details, rates, accommodations, services, amenities, imagery, booking paths, and operational information are sample content created to demonstrate Course System 03 — The Desert by Credence.'
    ]
  }
};

export function loadClient(slug) {
  const dir = path.join(CLIENT_WORK_DIR, slug);
  if (!fs.existsSync(dir)) throw new Error('Client folder not found: client-work/' + slug + ' (run "npm run client:new" first).');
  const client = readJson(path.join(dir, 'client.json'));
  const content = tryReadJson(path.join(dir, 'content.json'));
  const holes = tryReadJson(path.join(dir, 'holes.json'));
  const social = tryReadJson(path.join(dir, 'social.json'));
  const integrations = tryReadJson(path.join(dir, 'integrations.json'));
  return {
    dir, slug, client,
    content: content.ok ? content.data : null, contentError: content.ok ? null : content.error,
    holes: holes.ok ? holes.data : null, holesError: holes.ok ? null : holes.error,
    social: social.ok ? social.data : {}, socialError: social.ok ? null : social.error,
    integrations: integrations.ok ? integrations.data : {}, integrationsError: integrations.ok ? null : integrations.error,
    imagesDir: path.join(dir, 'images'),
    logosDir: path.join(dir, 'logos')
  };
}

/* Resolve display values with safe fallbacks (draft keeps working even when empty). */
export function buildModel(input) {
  const c = input.client;
  const sys = c.system;
  const b = c.business || {};
  const loc = c.location || {};
  const publicName = (b.publicName || '').trim();
  const shortName = (b.shortName || publicName).trim();
  const locLine = [loc.city, loc.state].filter(Boolean).join(', ');
  const heroHeadline = (input.content && input.content.hero && input.content.hero.headline) || '';
  return {
    system: sys,
    isProduction: c.siteMode === 'production',
    publicName, shortName,
    tagline: (b.tagline || '').trim(),
    description: (b.description || '').trim(),
    domain: (c.domain || '').trim(),
    locationLine: locLine,
    contact: c.contact || {},
    social: input.social || {},
    integrations: input.integrations || {},
    heroHeadline
  };
}
