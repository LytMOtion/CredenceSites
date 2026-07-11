/* ============================================================================
   tour.mjs — generate the Course Tour hole markup from holes.json for each
   system, matching the approved template structure and the existing JS engines
   (Coastal app.js, Desert desert.js). No demo hole content is used.
   ============================================================================ */
import { escapeHtml } from './render.mjs';

const pad2 = (n) => String(n).padStart(2, '0');
const nineOf = (h) => h.nine || (h.number <= 9 ? 'front' : 'back');
const nineName = (h, caps = true) => (nineOf(h) === 'back' ? (caps ? 'Back Nine' : 'Back nine') : (caps ? 'Front Nine' : 'Front nine'));
const holeImg = (h, def) => (h.image ? 'assets/images/' + h.image : def);
const holeAlt = (h) => escapeHtml(h.altText || ('Hole ' + h.number + (h.name ? ', ' + h.name : '') + '.'));
const riskLevel = (r) => (/high/i.test(r) ? 'high' : /med/i.test(r) ? 'med' : 'low');
const sorted = (holes) => holes.slice().sort((a, b) => a.number - b.number);

export function totals(holes) {
  const t = { parOut: 0, parIn: 0, champOut: 0, champIn: 0, memberOut: 0, memberIn: 0, resortOut: 0, resortIn: 0, forwardOut: 0, forwardIn: 0 };
  holes.forEach((h) => {
    const y = h.yardages || {}; const front = h.number <= 9;
    t[front ? 'parOut' : 'parIn'] += h.par || 0;
    t[front ? 'champOut' : 'champIn'] += y.championship || 0;
    t[front ? 'memberOut' : 'memberIn'] += y.member || 0;
    t[front ? 'resortOut' : 'resortIn'] += y.resort || 0;
    t[front ? 'forwardOut' : 'forwardIn'] += y.forward || 0;
  });
  t.parTotal = t.parOut + t.parIn;
  t.champTotal = t.champOut + t.champIn;
  t.memberTotal = t.memberOut + t.memberIn;
  t.resortTotal = t.resortOut + t.resortIn;
  t.forwardTotal = t.forwardOut + t.forwardIn;
  return t;
}

/* ---------- COASTAL ---------- */
export function coastalSelector(holes) {
  return sorted(holes).map((h) => `<button class="hbtn" data-hole="${h.number}">${h.number}</button>`).join('\n        ');
}
export function coastalPanels(holes, def) {
  const hs = sorted(holes);
  return hs.map((h, i) => {
    const prev = hs[(i - 1 + hs.length) % hs.length], next = hs[(i + 1) % hs.length];
    const y = h.yardages || {};
    const yardStr = [y.championship, y.member, y.resort, y.forward].filter((v) => v).join(' · ') || '—';
    const risk = h.riskReward ? `\n        <p class="hole-strategy" style="border-color:var(--marine-soft);margin-top:1rem">Risk / reward: ${escapeHtml(h.riskReward)}</p>` : '';
    return `      <article class="panel" data-hole-panel="${h.number}"${i === 0 ? '' : ' hidden'}>
        <figure class="shot shot--wide bleed" style="margin:0 0 1.3rem">
          <img src="${holeImg(h, def)}" width="1344" height="768" loading="lazy" alt="${holeAlt(h)}">
        </figure>
        <div class="panelhead" style="border-top:none;padding-top:0">
          <span class="holeno num">${h.number}</span>
          <div><p class="eyebrow">${nineName(h, false)}</p><h2 class="h3">${escapeHtml(h.name || ('Hole ' + h.number))}</h2></div>
        </div>
        <div class="tour-ledger ledger" role="group" aria-label="Hole ${h.number} details">
          <div class="ledger__row"><span class="ledger__k">Par</span><span class="ledger__v num">${h.par}</span></div>
          <div class="ledger__row"><span class="ledger__k">Yardage</span><span class="ledger__v num" style="font-size:.95rem;letter-spacing:0;white-space:normal;text-align:right">${yardStr}</span></div>
          <div class="ledger__row"><span class="ledger__k">Stroke index</span><span class="ledger__v num">${h.strokeIndex || h.number}</span></div>
        </div>
        <p class="hole-strategy">${escapeHtml(h.strategy || '')}</p>${risk}
        <nav class="hole-nav" aria-label="Hole navigation">
          <button class="hole-nav__btn" type="button" data-goto="${prev.number}"><span class="hole-nav__dir">&larr; Previous</span><span class="hole-nav__h">Hole ${prev.number}</span></button>
          <button class="hole-nav__btn hole-nav__btn--all" type="button" data-allholes><span class="hole-nav__h">All holes</span></button>
          <button class="hole-nav__btn hole-nav__btn--next" type="button" data-goto="${next.number}"><span class="hole-nav__dir">Next &rarr;</span><span class="hole-nav__h">Hole ${next.number}</span></button>
        </nav>
      </article>`;
  }).join('\n');
}
export function coastalStrip(holes) {
  const t = totals(holes);
  const fy = t.champOut.toLocaleString(), by = t.champIn.toLocaleString(), ty = t.champTotal.toLocaleString();
  return `<div><span class="datum__l">Front nine</span><span class="ledger__v num" style="text-align:left;font-size:1rem">${t.parOut} &middot; ${fy}</span></div>
      <div><span class="datum__l">Back nine</span><span class="ledger__v num" style="text-align:left;font-size:1rem">${t.parIn} &middot; ${by}</span></div>
      <div><span class="datum__l">Total par</span><span class="ledger__v num" style="text-align:left;font-size:1rem">${t.parTotal}</span></div>
      <div><span class="datum__l">Yards</span><span class="ledger__v num" style="text-align:left;font-size:1rem">${ty}</span></div>`;
}
export function coastalScorecard(holes, publicName) {
  const hs = sorted(holes), t = totals(holes);
  const row = (h) => `<tr><td>${h.number}</td><td>${h.par}</td><td>${(h.yardages || {}).championship || 0}</td><td>${h.strokeIndex || h.number}</td></tr>`;
  const front = hs.filter((h) => h.number <= 9).map(row).join('');
  const back = hs.filter((h) => h.number > 9).map(row).join('');
  return `<caption>${escapeHtml(publicName)} &middot; scorecard (championship tees)</caption><thead><tr><th>Hole</th><th>Par</th><th>Yards</th><th>SI</th></tr></thead><tbody>${front}<tr class="sc-sum"><td>Out</td><td>${t.parOut}</td><td>${t.champOut.toLocaleString()}</td><td></td></tr>${back}<tr class="sc-sum"><td>In</td><td>${t.parIn}</td><td>${t.champIn.toLocaleString()}</td><td></td></tr><tr class="sc-sum"><td>Total</td><td>${t.parTotal}</td><td>${t.champTotal.toLocaleString()}</td><td></td></tr></tbody>`;
}

/* ---------- DESERT ---------- */
export function desertSelector(holes) {
  return sorted(holes).map((h) => `<button class="hbtn" type="button" data-hole="${h.number}" data-nine="${nineOf(h)}" aria-label="Hole ${h.number}${h.name ? ', ' + escapeHtml(h.name) : ''}">${pad2(h.number)}</button>`).join('');
}
export function desertPanels(holes, def) {
  const hs = sorted(holes);
  return hs.map((h, i) => {
    const prev = hs[(i - 1 + hs.length) % hs.length], next = hs[(i + 1) % hs.length];
    const y = h.yardages || {};
    const risk = h.riskReward ? `\n        <p class="riskrow" data-risk="${riskLevel(h.riskReward)}"><span class="dot" aria-hidden="true"></span> Risk / reward: <b>${escapeHtml(h.riskReward)}</b></p>` : '';
    const label = (x) => `${pad2(x.number)}${x.name ? ' &mdash; ' + escapeHtml(x.name) : ''}`;
    return `<article class="holepanel" data-hole-panel="${h.number}"${i === 0 ? '' : ' hidden'}>
    <figure class="holehero fig imgscale">
      <img src="${holeImg(h, def)}" width="1600" height="1000" loading="lazy" decoding="async" alt="${holeAlt(h)}">
      <span class="holehero__scrim" aria-hidden="true"></span>
      <div class="holehero__id">
        <span class="holehero__no num">${h.number}</span>
        <div class="holehero__idtext"><p class="holehero__meta">${nineName(h)} &middot; Par ${h.par}</p><h2 class="holehero__title">${escapeHtml(h.name || ('Hole ' + h.number))}</h2></div>
      </div>
    </figure>
    <dl class="holerail">
      <div><dt>Par</dt><dd>${h.par}</dd></div>
      <div><dt>Stroke index</dt><dd>${h.strokeIndex || h.number}</dd></div>
      <div><dt>Championship</dt><dd>${y.championship || 0}<small>yds</small></dd></div>
      <div><dt>Resort</dt><dd>${y.resort || 0}<small>yds</small></dd></div>
      <div><dt>Forward</dt><dd>${y.forward || 0}<small>yds</small></dd></div>
    </dl>
    <div class="holeplay">
      <div class="holeplay__body">
        <p class="uplabel">The play</p>
        <p class="holeplay__copy">${escapeHtml(h.strategy || '')}</p>${risk}
      </div>
    </div>
    <nav class="holenav" aria-label="Hole navigation">
      <button type="button" data-goto="${prev.number}"><span>&larr; Previous</span>${label(prev)}</button>
      <button type="button" data-allholes><span>Selector</span>All holes</button>
      <button type="button" class="next" data-goto="${next.number}"><span>Next &rarr;</span>${label(next)}</button>
    </nav>
  </article>`;
  }).join('');
}
export function desertScorecard(holes) {
  const hs = sorted(holes), t = totals(holes);
  const row = (h) => `<tr><td>${h.number}</td><td>${h.par}</td><td>${h.strokeIndex || h.number}</td><td>${(h.yardages || {}).championship || 0}</td><td>${(h.yardages || {}).resort || 0}</td><td>${(h.yardages || {}).forward || 0}</td></tr>`;
  const front = hs.filter((h) => h.number <= 9).map(row).join('');
  const back = hs.filter((h) => h.number > 9).map(row).join('');
  const cap = `Par ${t.parTotal} &middot; ${t.champTotal.toLocaleString()} yards (championship)`;
  return `<caption>${cap}</caption>
<thead><tr><th>Hole</th><th>Par</th><th>HCP</th><th>Champ</th><th>Resort</th><th>Forward</th></tr></thead>
<tbody>${front}
<tr class="sum"><td>Out</td><td>${t.parOut}</td><td></td><td>${t.champOut}</td><td>${t.resortOut}</td><td>${t.forwardOut}</td></tr>
${back}
<tr class="sum"><td>In</td><td>${t.parIn}</td><td></td><td>${t.champIn}</td><td>${t.resortIn}</td><td>${t.forwardIn}</td></tr>
<tr class="sum tot"><td>Total</td><td>${t.parTotal}</td><td></td><td>${t.champTotal}</td><td>${t.resortTotal}</td><td>${t.forwardTotal}</td></tr>
</tbody>`;
}
