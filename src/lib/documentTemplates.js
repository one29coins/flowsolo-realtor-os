// Starter documents seeded into the Document Vault on first load.
// Inserted by useDocuments when the agent has zero documents.
// Each entry maps to a row in the `documents` table.

export const DOCUMENT_TEMPLATES = [
  {
    title: 'Buyer Representation Agreement Checklist',
    category: 'Buyer Documents',
    document_type: 'Checklist',
    description: 'Run through this every time a new buyer signs representation so the file is clean from day one.',
    content: [
      '1. Confirm buyer\'s full legal name(s) matches government ID for closing docs.',
      '2. Verify property type focus, target areas, and price range are agreed in writing.',
      '3. Disclose agency relationship and confirm signed disclosure form is on file.',
      '4. Define exclusive vs. non-exclusive representation term and end date.',
      '5. Confirm compensation source (seller-paid, buyer-paid, or split) and amount.',
      '6. Provide pre-approval requirements and recommended lender contacts.',
      '7. Send copy of fully executed agreement to buyer within 24 hours.',
      '8. Upload signed PDF to client folder and tag in CRM.',
      '9. Add buyer to weekly market-update email list.',
      '10. Schedule kickoff buyer consultation call within 7 days.'
    ].join('\n')
  },
  {
    title: 'Listing Presentation Outline',
    category: 'Seller Documents',
    document_type: 'Template',
    description: 'The exact structure to walk a seller through at a listing appointment so they sign that night.',
    content: [
      'SECTION 1 — Discovery (10 min)',
      '  • Motivation for selling and ideal timeline',
      '  • Prior agent experience and what they liked / disliked',
      '  • Net proceeds target and how that maps to list price',
      '',
      'SECTION 2 — Market Snapshot (10 min)',
      '  • Active comps in the same neighborhood',
      '  • Recently sold comps with days on market and list-to-sale ratio',
      '  • Current absorption rate and months of inventory',
      '',
      'SECTION 3 — Pricing Strategy (10 min)',
      '  • Suggested list price range with supporting comps',
      '  • Pricing psychology (round-number breakpoints, search-band fit)',
      '  • Expected showing volume and offer pacing at each price',
      '',
      'SECTION 4 — Marketing Plan (15 min)',
      '  • Pro photography, twilight shots, and floorplan',
      '  • MLS, syndication, social, and paid promotion plan',
      '  • Open house and broker-tour schedule',
      '',
      'SECTION 5 — The Ask (5 min)',
      '  • Walk through listing agreement clause by clause',
      '  • Sign exclusive-right-to-sell agreement and disclosures',
      '  • Schedule photography and pre-list prep visit'
    ].join('\n')
  },
  {
    title: 'Offer Submission Checklist',
    category: 'Offer Templates',
    document_type: 'Checklist',
    description: 'Use this before hitting send on any buyer offer so it lands strong with the listing agent.',
    content: [
      '1. Confirm buyer pre-approval is current (issued within 30 days).',
      '2. Verify offer price aligns with comps and any escalation strategy.',
      '3. Earnest money amount confirmed and source documented.',
      '4. Financing contingency timeline aligned with lender clear-to-close estimate.',
      '5. Inspection contingency window set (10 days standard).',
      '6. Appraisal contingency in place or waived with gap coverage acknowledged.',
      '7. Closing date negotiated with seller\'s preferred timeline.',
      '8. Buyer love letter reviewed (only if state allows, and disclosed).',
      '9. All addenda signed and dated (lead-based paint, HOA, etc.).',
      '10. Submit via listing agent\'s preferred channel and request written receipt.'
    ].join('\n')
  },
  {
    title: 'Home Inspection Review Notes Template',
    category: 'Inspection',
    document_type: 'Template',
    description: 'Fill this in during or right after a home inspection so the buyer can decide on objections fast.',
    content: [
      'PROPERTY: __________________________   INSPECTION DATE: __________',
      'INSPECTOR: ___________________   BUYER PRESENT: Y / N',
      '',
      'STRUCTURAL',
      '  Foundation: ____________________________________________',
      '  Framing: _______________________________________________',
      '  Roof condition + remaining life: ______________________',
      '',
      'SYSTEMS',
      '  HVAC age + condition: __________________________________',
      '  Electrical panel + capacity: ___________________________',
      '  Plumbing notes (leaks, water pressure): ________________',
      '  Water heater age: ______________________________________',
      '',
      'SAFETY',
      '  GFCI / smoke / CO detectors functional: ________________',
      '  Radon / mold / asbestos flags: _________________________',
      '',
      'EXTERIOR + GROUNDS',
      '  Drainage, grading, gutters: ____________________________',
      '  Windows, siding, paint: ________________________________',
      '',
      'TOP 3 ITEMS TO NEGOTIATE',
      '  1. ____________________________________________________',
      '  2. ____________________________________________________',
      '  3. ____________________________________________________',
      '',
      'AGENT RECOMMENDATION: REQUEST REPAIRS / CREDIT / WALK / NO ACTION'
    ].join('\n')
  },
  {
    title: 'Closing Day Checklist',
    category: 'Title and Closing',
    document_type: 'Checklist',
    description: 'Every box you and your client need to clear on closing day so nothing derails the table.',
    content: [
      '1. Final walkthrough completed within 24 hours of closing.',
      '2. Cashier\'s check or wire confirmation received for buyer funds.',
      '3. Title commitment reviewed — exceptions cleared.',
      '4. Government-issued photo ID confirmed for every signer.',
      '5. Closing disclosure matches loan estimate (review with buyer).',
      '6. All addenda + amendments executed and in title\'s file.',
      '7. Utility transfer scheduled for day-of for buyer.',
      '8. Keys, garage remotes, mail keys, and HOA fobs accounted for.',
      '9. Commission disbursement instructions submitted to title.',
      '10. Post-close handoff packet ready (warranty info, vendor list, thank-you note).'
    ].join('\n')
  }
]
