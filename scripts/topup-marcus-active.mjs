// Additive top-up #2 for Marcus Reed (Houston). Brings his active listing
// count up to 10 by adding 4 more Active listings plus the mock data that
// surrounds them — clients, leads, showings, open houses, tasks, check-ins,
// documents, and market notes.
//
// Idempotency: uses a unique marker client ('Priya Raman'). If that client
// already exists on Marcus's profile, the top-up is skipped. Safe to re-run.

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
)

function iso(d) { return d.toISOString().slice(0, 10) }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
function daysAhead(n) { const d = new Date(); d.setDate(d.getDate() + n); return iso(d) }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }

// ─── persona configuration ───────────────────────────────────────────────────
const MARCUS = {
  email: 'marcus@reedrealty.com',
  marker: 'Priya Raman',
  city: 'Houston',
  clients: [
    { name: 'Priya Raman', email: 'priya.raman@gmail.com', phone: '713-555-0612', client_type: 'Buyer', transaction_status: 'Active', property_type: 'Single Family', budget_min: 950000, budget_max: 1350000, pre_approved: true, pre_approval_amount: 1350000, pre_approval_expiry: daysAhead(48), desired_location: 'West University / Southside Place', must_haves: '4 bed; home office; walk to West U Elementary', deal_breakers: 'No flood history; no busy corner lot', timeline: '1-3 months', referred_by: 'Karim Saleh', closing_date: null, preferred_contact: 'Text', priority: 'High', notes: 'Both spouses physicians at Texas Medical Center.' },
    { name: 'Grant Whitfield', email: 'grant@whitfieldco.com', phone: '281-555-0633', client_type: 'Seller', transaction_status: 'Active', property_type: 'Single Family', budget_min: null, budget_max: null, pre_approved: false, pre_approval_amount: null, pre_approval_expiry: null, desired_location: '', must_haves: '', deal_breakers: '', timeline: 'ASAP', referred_by: 'Past Client', closing_date: null, preferred_contact: 'Phone', priority: 'High', notes: 'Relocating to Dallas for work; needs to list fast.' },
    { name: 'Lucia Ferraro', email: 'lucia.ferraro@gmail.com', phone: '832-555-0658', client_type: 'Buyer', transaction_status: 'Active', property_type: 'Condo', budget_min: 480000, budget_max: 640000, pre_approved: true, pre_approval_amount: 640000, pre_approval_expiry: daysAhead(38), desired_location: 'Museum District / Midtown', must_haves: 'High floor; skyline view; concierge', deal_breakers: 'No ground floor; no west-facing', timeline: 'ASAP', referred_by: 'Instagram', closing_date: null, preferred_contact: 'Text', priority: 'High', notes: 'Gallery curator — wants light + wall space for art.' },
    { name: 'Theo Banks', email: 'theo@banksholdings.com', phone: '713-555-0671', client_type: 'Both', transaction_status: 'Active', property_type: 'Investment', budget_min: 700000, budget_max: 1050000, pre_approved: true, pre_approval_amount: 1050000, pre_approval_expiry: daysAhead(52), desired_location: 'EaDo / Second Ward', must_haves: 'Fourplex or larger; value-add; under 6% vacancy', deal_breakers: 'No foundation issues', timeline: 'ASAP', referred_by: 'Devin Larkin', closing_date: null, preferred_contact: 'Email', priority: 'High', notes: '1031 exchange — must identify within 30 days.' }
  ],
  listings: [
    { key: 'raman', client_name: 'Priya Raman', row: { name: 'Raman — 6204 Auden St', status: 'Active', property_address: '6204 Auden St', city: 'Houston', state: 'TX', zip: '77005', list_price: 1245000, sale_price: null, commission_rate: 3.0, listing_type: 'Buyer Agency', property_type: 'Single Family', bedrooms: 4, bathrooms: 3.5, square_feet: 3460, year_built: 2013, mls_number: 'HAR4582117', days_on_market: 6, showing_count: 5, offer_count: 0, open_house_count: 1, photos_link: 'https://drive.google.com/links/raman-photos', virtual_tour_link: 'https://my.matterport.com/show/?m=raman', listing_date: daysAgo(6), listing_expiry: daysAhead(84), priority: 'High', notes: 'Buyer-side rep for Priya. Walk to West U Elementary. 2nd showing Saturday.' } },
    { key: 'whitfield', client_name: 'Grant Whitfield', row: { name: 'Whitfield — 11 Pinewood Ct', status: 'Active', property_address: '11 Pinewood Ct', city: 'Houston', state: 'TX', zip: '77024', list_price: 1675000, sale_price: null, commission_rate: 3.0, listing_type: 'Exclusive Right to Sell', property_type: 'Single Family', bedrooms: 5, bathrooms: 4.5, square_feet: 4380, year_built: 2006, mls_number: 'HAR4585902', days_on_market: 9, showing_count: 7, offer_count: 0, open_house_count: 1, photos_link: '', virtual_tour_link: 'https://my.matterport.com/show/?m=whitfield', listing_date: daysAgo(9), listing_expiry: daysAhead(81), priority: 'High', notes: 'Memorial Villas. Seller relocating to Dallas — motivated.' } },
    { key: 'ferraro', client_name: 'Lucia Ferraro', row: { name: 'Ferraro — 5005 Hidalgo St #2204', status: 'Active', property_address: '5005 Hidalgo St Unit 2204', city: 'Houston', state: 'TX', zip: '77056', list_price: 595000, sale_price: null, commission_rate: 2.75, listing_type: 'Buyer Agency', property_type: 'Condo', bedrooms: 2, bathrooms: 2, square_feet: 1520, year_built: 2017, mls_number: 'HAR4588340', days_on_market: 3, showing_count: 2, offer_count: 0, open_house_count: 0, photos_link: '', virtual_tour_link: '', listing_date: daysAgo(3), listing_expiry: daysAhead(27), priority: 'High', notes: 'Buyer-side rep for Lucia. 22nd-floor skyline view. Tour Friday.' } },
    { key: 'banks', client_name: 'Theo Banks', row: { name: 'Banks — 2118 Canal St', status: 'Active', property_address: '2118 Canal St', city: 'Houston', state: 'TX', zip: '77003', list_price: 945000, sale_price: null, commission_rate: 2.75, listing_type: 'Buyer Agency', property_type: 'Multi-Family', bedrooms: 8, bathrooms: 4, square_feet: 4120, year_built: 1974, mls_number: 'HAR4590771', days_on_market: 4, showing_count: 3, offer_count: 0, open_house_count: 0, photos_link: '', virtual_tour_link: '', listing_date: daysAgo(4), listing_expiry: daysAhead(56), priority: 'High', notes: 'EaDo fourplex. 5.7% projected cap. Theo on a 1031 clock.' } }
  ],
  leads: [
    { name: 'Sienna Marsh', email: 'sienna.marsh@gmail.com', phone: '713-555-0744', lead_type: 'Buyer', lead_source: 'Zillow', stage: 'Qualified', property_type: 'Single Family', budget_min: 900000, budget_max: 1250000, desired_location: 'West University', timeline: '1-3 months', notes: 'Saw Auden St listing online — wants a private tour.', last_contact: daysAgo(1), next_follow_up: daysAhead(1) },
    { name: 'Cole Hammond', email: 'cole.hammond@gmail.com', phone: '832-555-0767', lead_type: 'Buyer', lead_source: 'Sign Call', stage: 'Showing', property_type: 'Single Family', budget_min: 1400000, budget_max: 1800000, desired_location: 'Memorial Villas', timeline: 'ASAP', notes: 'Drove by Pinewood Ct sign. Touring this weekend.', last_contact: daysAgo(0), next_follow_up: daysAhead(1) },
    { name: 'Mira Patel', email: 'mira.patel@gmail.com', phone: '281-555-0782', lead_type: 'Both', lead_source: 'Sphere of Influence', stage: 'New Lead', property_type: 'Multi-Family', budget_min: 800000, budget_max: 1100000, desired_location: 'EaDo / Second Ward', timeline: '6-12 months', notes: 'Devin Larkin referral. Building a small portfolio.', last_contact: daysAgo(0), next_follow_up: daysAhead(2) },
    { name: 'Jonah Reyes', email: 'jonah.reyes@gmail.com', phone: '713-555-0805', lead_type: 'Buyer', lead_source: 'Open House', stage: 'Qualified', property_type: 'Condo', budget_min: 500000, budget_max: 650000, desired_location: 'Museum District', timeline: '1-3 months', notes: 'Visited Hidalgo open house. Wants high-floor units only.', last_contact: daysAgo(1), next_follow_up: daysAhead(2) }
  ],
  marketNotes: [
    { week_date: daysAgo(3), area: 'West University / Bellaire', avg_list_price: 1185000, avg_sale_price: 1162000, avg_dom: 19, list_to_sale_ratio: 0.981, active_listings: 71, new_listings: 14, closed_sales: 11, months_of_inventory: 2.5, market_trend: "Seller's Market", notes: 'Sub-$1.3M moving fast; tight inventory near top schools.' },
    { week_date: daysAgo(10), area: 'EaDo / Second Ward', avg_list_price: 612000, avg_sale_price: 598000, avg_dom: 28, list_to_sale_ratio: 0.977, active_listings: 49, new_listings: 12, closed_sales: 8, months_of_inventory: 3.1, market_trend: 'Balanced Market', notes: 'Investor demand steady for value-add multifamily.' }
  ]
}

// ─── data builders ────────────────────────────────────────────────────────────
function showingsFor() {
  return [
    { client_name: 'Priya Raman', listing_key: 'raman', date: daysAhead(2), time: '11:00', dur: 45, status: 'Scheduled', feedback: '', notes: '2nd showing — confirming school walk-route + lot drainage.', interest: null, offerLikely: false, fu: false },
    { client_name: 'Lucia Ferraro', listing_key: 'ferraro', date: daysAhead(3), time: '17:00', dur: 30, status: 'Scheduled', feedback: '', notes: 'Evening tour to check skyline view + light.', interest: null, offerLikely: false, fu: false },
    { client_name: 'Theo Banks', listing_key: 'banks', date: daysAhead(4), time: '10:00', dur: 75, status: 'Scheduled', feedback: '', notes: 'Walking all 4 units; bringing rent roll + cap-rate sheet.', interest: null, offerLikely: false, fu: false },
    { client_name: 'Priya Raman', listing_key: 'raman', date: daysAgo(3), time: '14:00', dur: 45, status: 'Completed', feedback: 'Loved the office + natural light; wants foundation report.', notes: 'Ordered foundation + drainage report for review.', interest: 5, offerLikely: true, fu: true },
    { client_name: 'Grant Whitfield', listing_key: 'whitfield', date: daysAgo(4), time: '13:00', dur: 60, status: 'Completed', feedback: 'Buyer family loved primary suite; questioned pool age.', notes: 'Pulled pool resurfacing quotes for the buyer.', interest: 4, offerLikely: false, fu: true },
    { client_name: 'Lucia Ferraro', listing_key: 'ferraro', date: daysAgo(2), time: '16:00', dur: 30, status: 'Completed', feedback: 'Great view; worried about HOA dues.', notes: 'Sent 3-year HOA financials + reserve study.', interest: 4, offerLikely: false, fu: true }
  ]
}

function openHousesFor() {
  return [
    { listing_key: 'whitfield', date: daysAhead(5), start: '13:00', end: '15:00', status: 'Scheduled', visitors: 0, expected: 28, signIns: [], notes: 'Memorial luxury — catered; push to high-net-worth IG list.', sent: false, leads: 0 },
    { listing_key: 'raman', date: daysAhead(6), start: '12:00', end: '14:00', status: 'Scheduled', visitors: 0, expected: 22, signIns: [], notes: 'West U family crowd — yard signs in surrounding blocks.', sent: false, leads: 0 },
    { listing_key: 'raman', date: daysAgo(4), start: '13:00', end: '15:00', status: 'Completed', visitors: 24, expected: 20, signIns: [{ name: 'Sienna Marsh', email: 'sienna.marsh@gmail.com', phone: '713-555-0744' }], notes: 'Strong family turnout; one likely buyer.', sent: true, leads: 2 },
    { listing_key: 'whitfield', date: daysAgo(6), start: '13:00', end: '15:00', status: 'Completed', visitors: 19, expected: 22, signIns: [{ name: 'Cole Hammond', email: 'cole.hammond@gmail.com', phone: '832-555-0767' }], notes: 'Move-up buyers; 1 hot lead.', sent: true, leads: 1 }
  ]
}

function tasksFor() {
  return [
    { name: 'Order foundation report for Auden St', status: 'In Progress', priority: 'High', due_date: daysAhead(1), notes: 'Priya wants it before writing offer', completed: false, listing_key: 'raman' },
    { name: 'Pre-list staging walk-through at Pinewood Ct', status: 'To Do', priority: 'High', due_date: daysAhead(2), notes: 'Stager + photographer same day', completed: false, listing_key: 'whitfield' },
    { name: 'Send HOA financials to Ferraro', status: 'Done', priority: 'High', due_date: daysAgo(1), notes: '', completed: true, listing_key: 'ferraro' },
    { name: 'Build rent roll + cap-rate sheet for Canal St', status: 'In Progress', priority: 'High', due_date: daysAhead(3), notes: 'Theo on a 1031 clock — needs fast', completed: false, listing_key: 'banks' },
    { name: 'Private tour for Sienna Marsh at Auden St', status: 'To Do', priority: 'Medium', due_date: daysAhead(1), notes: '', completed: false, listing_key: 'raman' },
    { name: 'Investor pre-qual call with Mira Patel', status: 'To Do', priority: 'Medium', due_date: daysAhead(2), notes: '', completed: false, listing_key: null }
  ]
}

function followUpsFor() {
  return [
    { client_name: 'Priya Raman', title: 'Foundation report review: Raman', type: 'Showing Feedback', date: daysAhead(1), channel: 'Phone Call', interest: '6204 Auden St', notes: 'Review report findings before drafting offer.', status: 'Scheduled', outcome: '' },
    { client_name: 'Grant Whitfield', title: 'Listing presentation: Whitfield', type: 'Seller Listing Presentation', date: daysAgo(11), channel: 'In-Person Meeting', interest: '11 Pinewood Ct', notes: '', status: 'Done', outcome: 'Signed exclusive listing at $1.675M; staging + photos scheduled.' },
    { client_name: 'Theo Banks', title: 'Canal St numbers walkthrough', type: 'Buyer Consultation', date: daysAhead(4), channel: 'In-Person Meeting', interest: '2118 Canal St', notes: 'Walk cap rate + value-add plan; confirm 1031 timeline.', status: 'Scheduled', outcome: '' },
    { client_name: 'Lucia Ferraro', title: 'Post-tour debrief: Ferraro', type: 'Buyer Consultation', date: daysAhead(4), channel: 'Video Call', interest: '5005 Hidalgo St', notes: 'Decide whether to offer after HOA review.', status: 'Scheduled', outcome: '' }
  ]
}

function documentsFor() {
  return [
    { client_name: 'Priya Raman', listing_key: 'raman', title: 'Buyer Rep Agreement — Raman', category: 'Buyer Documents', document_type: 'Agreement', description: 'Signed buyer rep with Priya Raman', file_link: 'https://drive.google.com/file/d/raman-rep' },
    { client_name: null, listing_key: 'whitfield', title: 'Whitfield — Listing Agreement (Memorial)', category: 'Seller Documents', document_type: 'Agreement', description: 'Exclusive Right to Sell', file_link: 'https://drive.google.com/file/d/whitfield-listing' },
    { client_name: null, listing_key: 'whitfield', title: 'Whitfield — Seller Disclosure', category: 'Disclosures', document_type: 'Form', description: 'TX seller disclosure form', file_link: 'https://drive.google.com/file/d/whitfield-disclosure' },
    { client_name: 'Theo Banks', listing_key: 'banks', title: 'Canal St — Rent Roll + Pro Forma', category: 'Buyer Documents', document_type: 'Reference', description: 'Current rents + value-add pro forma', file_link: 'https://drive.google.com/file/d/canal-proforma' },
    { client_name: null, listing_key: 'ferraro', title: 'Hidalgo #2204 — HOA Financials', category: 'Buyer Documents', document_type: 'Reference', description: '3-year HOA financials + reserve study', file_link: 'https://drive.google.com/file/d/hidalgo-hoa' }
  ]
}

// ─── seeder ───────────────────────────────────────────────────────────────────
async function topup(persona) {
  console.log(`\n▶ ${persona.email} (${persona.city}) — active-listings top-up`)

  const { data: list } = await supabase.auth.admin.listUsers()
  const user = list.users.find(u => u.email?.toLowerCase() === persona.email.toLowerCase())
  if (!user) { console.log(`  ✗ user not found — skipping`); return }
  const userId = user.id

  // idempotency check
  const { data: existing } = await supabase
    .from('clients').select('id, name').eq('user_id', userId).eq('name', persona.marker)
  if (existing && existing.length > 0) {
    console.log(`  ◇ already topped up (found marker: "${persona.marker}") — skipping`)
    return
  }

  // clients
  const { data: insertedClients, error: cErr } = await supabase.from('clients')
    .insert(persona.clients.map(c => ({ ...c, user_id: userId }))).select()
  if (cErr) throw cErr
  const clientsByName = Object.fromEntries(insertedClients.map(c => [c.name, c]))
  console.log(`  ✓ +${insertedClients.length} clients`)

  // listings (project rows)
  const listingRows = persona.listings.map(l => ({
    ...l.row,
    user_id: userId,
    client_id: l.client_name ? clientsByName[l.client_name]?.id : insertedClients[0].id
  }))
  const { data: insertedListings, error: lErr } = await supabase.from('projects')
    .insert(listingRows).select()
  if (lErr) throw lErr
  const listingsByKey = Object.fromEntries(
    persona.listings.map((l, i) => [l.key, insertedListings[i]])
  )
  const activeCount = insertedListings.filter(l => l.status === 'Active').length
  console.log(`  ✓ +${insertedListings.length} listings (${activeCount} active)`)

  // leads
  const { error: leadErr } = await supabase.from('leads')
    .insert(persona.leads.map(l => ({ ...l, user_id: userId })))
  if (leadErr) throw leadErr
  console.log(`  ✓ +${persona.leads.length} leads`)

  // showings
  const showings = showingsFor().map(s => ({
    user_id: userId,
    client_id: clientsByName[s.client_name].id,
    listing_id: listingsByKey[s.listing_key].id,
    property_address: listingsByKey[s.listing_key].property_address,
    showing_date: s.date, showing_time: s.time, duration_minutes: s.dur,
    status: s.status, client_feedback: s.feedback, agent_notes: s.notes,
    interest_level: s.interest, offer_likely: s.offerLikely, follow_up_needed: s.fu
  }))
  const { error: shErr } = await supabase.from('showings').insert(showings)
  if (shErr) throw shErr
  console.log(`  ✓ +${showings.length} showings`)

  // open houses
  const openHouses = openHousesFor().map(o => ({
    user_id: userId,
    listing_id: listingsByKey[o.listing_key].id,
    date: o.date, start_time: o.start, end_time: o.end,
    status: o.status, visitors: o.visitors, expected_visitors: o.expected,
    sign_ins: o.signIns, notes: o.notes, follow_ups_sent: o.sent, leads_generated: o.leads
  }))
  const { error: ohErr } = await supabase.from('open_houses').insert(openHouses)
  if (ohErr) throw ohErr
  console.log(`  ✓ +${openHouses.length} open houses`)

  // tasks
  const tasks = tasksFor().map(t => ({
    user_id: userId,
    project_id: t.listing_key ? listingsByKey[t.listing_key]?.id : null,
    name: t.name, status: t.status, priority: t.priority, due_date: t.due_date,
    notes: t.notes, completed: !!t.completed
  }))
  const { error: tkErr } = await supabase.from('tasks').insert(tasks)
  if (tkErr) throw tkErr
  console.log(`  ✓ +${tasks.length} tasks`)

  // check-ins
  const fus = followUpsFor().map(f => ({
    user_id: userId,
    client_id: clientsByName[f.client_name].id,
    lead_id: null,
    title: f.title, type: f.type, follow_up_type: f.type,
    status: f.status, follow_up_date: f.date,
    channel: f.channel, property_interest: f.interest,
    notes: f.notes, outcome: f.outcome, outcome_detail: ''
  }))
  const { error: fuErr } = await supabase.from('follow_ups').insert(fus)
  if (fuErr) throw fuErr
  console.log(`  ✓ +${fus.length} check-ins`)

  // documents
  const docs = documentsFor().map(d => ({
    user_id: userId,
    client_id: d.client_name ? clientsByName[d.client_name]?.id : null,
    listing_id: d.listing_key ? listingsByKey[d.listing_key]?.id : null,
    title: d.title, category: d.category, document_type: d.document_type,
    description: d.description, file_link: d.file_link || null, content: d.content || null,
    status: 'Active'
  }))
  const { error: dErr } = await supabase.from('documents').insert(docs)
  if (dErr) throw dErr
  console.log(`  ✓ +${docs.length} documents`)

  // market notes
  const { error: mnErr } = await supabase.from('market_notes')
    .insert(persona.marketNotes.map(m => ({ ...m, user_id: userId })))
  if (mnErr) throw mnErr
  console.log(`  ✓ +${persona.marketNotes.length} market notes`)
}

// ─── run ──────────────────────────────────────────────────────────────────────
try { await topup(MARCUS) }
catch (e) { console.error(`✗ ${MARCUS.email}: ${e.message}`) }
console.log('\nDone.\n')
