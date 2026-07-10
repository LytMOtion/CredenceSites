/* OCEAN BLUFF NATIONAL — Course System 01 (The Coastal) · fictional demonstration data.
   Ocean Bluff National Golf Club is a FICTIONAL property created to demonstrate
   Credence Course System 01 — The Coastal. Every value below is fictional sample /
   demonstration content. No real bookings, payments, or reservations are processed. */
window.OCEANBLUFF = {
  facts: {
    name: 'Ocean Bluff National Golf Club',
    shortName: 'Ocean Bluff National',
    location: 'California Coast',
    website: 'oceanbluffnational.example',
    email: 'hello@oceanbluffnational.example',
    phone: '(805) 555-0148',
    hours: '6:30 AM – 8:00 PM daily (sample hours)',
    holes: 18, par: 72,
    note: 'Fictional demonstration property — facts below are sample content only.'
  },
  nav: [
    { label: 'The Course', href: 'tour.html' },
    { label: 'Rates & Tee Times', href: 'rates.html' },
    { label: 'Events', href: 'events.html' },
    { label: 'The Bluff House', href: 'grill.html' },
    { label: 'Story', href: 'story.html' }
  ],
  // Fictional sample rates — demonstration pricing only. No checkout or payment.
  rates: {
    flag: 'demo',
    rows: [
      { k: 'Weekday · 18 holes', sub: 'Mon–Thu, before noon', v: 165 },
      { k: 'Weekend · 18 holes', sub: 'Fri–Sun & holidays, before noon', v: 185 },
      { k: 'Twilight', sub: 'After 2:00 PM, cart included', v: 110 },
      { k: 'Super-twilight', sub: 'After 4:00 PM', v: 80 },
      { k: 'Replay (same day)', sub: 'Subject to availability', v: 65 },
      { k: 'Cart', sub: 'Per player, where not included', v: 24 }
    ],
    policies: [
      'All rates and policies shown are fictional demonstration content.',
      'Sample cancellation window: up to 24 hours before your tee time.',
      'Plan for roughly 4½ hours of play.',
      'The coastal marine layer can hold into late morning — layers are wise even in summer.',
      'All-grass practice range; range balls included with your round.'
    ]
  },
  // Fictional sample course data (not a real course). Numbers are internally consistent samples.
  holes: {
    oceanStretch: [10, 11, 12, 13, 14],
    detail: {
      4:  { par: 4, pacific: 'none (inland)', character: 'a rolling inland hole through native dunes — the ocean is out of play',
            flag: 'archetype-inland', imageMissing: 'inland reference frame' },
      10: { par: 4, pacific: 'the ocean stretch begins here', character: 'the reveal — the routing turns to the water',
            flag: 'archetype-transition', image: 'hole-transition' },
      12: { par: 4, pacific: 'adjacent', flag: 'scaffold' },
      13: { par: 5, name: 'The reachable par five', pacific: 'plays toward the ocean',
            strategy: 'A good drive tempts you to go for the green in two — the reward and the risk both sit out toward the water.',
            note: 'Fictional sample hole description.' },
      14: { par: 4, pacific: 'adjacent', flag: 'scaffold' }
    }
  },
  // Fictional story — general language only. No real history, architect, people, or dates.
  story: {
    chapters: [
      { year: '', text: 'Ocean Bluff National was imagined as a modern coastal course shaped by wind, dunes, native landscape, and the changing character of the Pacific.' },
      { year: '', text: 'The routing was drawn to follow the land at the edge of the water, letting the coastline set the rhythm of the round.' },
      { year: '', text: 'Beyond the round, the property was planned around hospitality — dining at The Bluff House and gatherings above the sea.' }
    ],
    note: 'Fictional demonstration narrative. No real events, people, architect, or dates are represented.'
  }
};
/* OUTBOUND DESTINATIONS — fictional demonstration only.
   There is NO real booking provider. Every booking control leads to the local
   demonstration flow (booking-demo.html). No tee time, payment, or reservation is processed. */
window.OCEANBLUFF.destinations = {
  book_nonResident: 'booking-demo.html',
  book_resident:    'booking-demo.html',
  book_preferred:   'booking-demo.html',
  book_reciprocal:  'booking-demo.html',
  scorecard:        null
};

/* SHOP CONFIG — future client configuration only. No store, cart, or payment is built.
   A future generator can populate these to point the demonstration shop at a real provider. */
window.OCEANBLUFF.shop = {
  shop_url: null,
  shop_provider: null,
  gift_card_url: null,
  shop_link_label: 'Visit the Online Shop',
  shop_integration_type: null
};
