import { toNumber, toDateOrNull, pickOption } from './csv'
import {
  CLIENT_TYPES,
  TRANSACTION_STATUSES,
  PROPERTY_TYPES,
  LISTING_TYPES,
  LISTING_STATUSES,
  LEAD_SOURCES,
  TIMELINE_OPTIONS,
  PREFERRED_CONTACT,
  FOLLOW_UP_TYPES,
  FOLLOW_UP_CHANNELS,
  COMMISSION_STATUSES,
  PRIORITY_LEVELS,
  TASK_STATUSES,
  FOLLOW_UP_STATUSES
} from './realtorConstants'

// Legacy synonyms so older spreadsheets still import cleanly
const TASK_STATUS_ALIASES = {
  'todo': 'To Do',
  'inbox': 'To Do',
  'backlog': 'To Do',
  'in progress': 'In Progress',
  'doing': 'In Progress',
  'waiting on client': 'Waiting',
  'blocked': 'Waiting',
  'done': 'Done',
  'complete': 'Done',
  'completed': 'Done'
}
const FOLLOWUP_STATUS_ALIASES = {
  'to do': 'Scheduled',
  'pending': 'Scheduled',
  'open': 'Scheduled',
  'complete': 'Done',
  'completed': 'Done'
}

function resolveTaskStatus(v) {
  if (!v) return 'To Do'
  const lower = String(v).toLowerCase().trim()
  if (TASK_STATUS_ALIASES[lower]) return TASK_STATUS_ALIASES[lower]
  return pickOption(v, TASK_STATUSES, 'To Do')
}

function resolveFollowUpStatus(v) {
  if (!v) return 'Scheduled'
  const lower = String(v).toLowerCase().trim()
  if (FOLLOWUP_STATUS_ALIASES[lower]) return FOLLOWUP_STATUS_ALIASES[lower]
  return pickOption(v, FOLLOW_UP_STATUSES, 'Scheduled')
}

function findClient(clients, ...keys) {
  // Match against name or email — case-insensitive
  const queries = keys.filter(Boolean).map(k => String(k).toLowerCase().trim())
  if (!queries.length) return null
  return clients.find(c => {
    const candidates = [c.name, c.email].filter(Boolean).map(v => v.toLowerCase().trim())
    return queries.some(q => candidates.includes(q))
  })
}

function findListing(listings, addressOrName, clientId) {
  if (!addressOrName) return null
  const q = String(addressOrName).toLowerCase().trim()
  return listings.find(l => {
    const matchesName = l.name?.toLowerCase() === q
    const matchesAddress = l.property_address?.toLowerCase() === q
    const matchesClient = !clientId || l.client_id === clientId || l.seller_id === clientId
    return (matchesName || matchesAddress) && matchesClient
  })
}

// ---------- Clients (buyers / sellers / past clients) ----------
export const clientImport = {
  templateHeaders: [
    'name', 'email', 'phone', 'brokerage_name',
    'client_type', 'transaction_status', 'property_type',
    'budget_min', 'budget_max',
    'pre_approved', 'pre_approval_amount', 'pre_approval_expiry',
    'desired_location', 'must_haves', 'deal_breakers',
    'timeline', 'referred_by', 'preferred_contact',
    'closing_date', 'priority', 'notes'
  ],
  templateSample: [{
    name: 'Riley Carter',
    email: 'riley@example.com',
    phone: '555-0143',
    brokerage_name: 'Summit Realty',
    client_type: 'Buyer',
    transaction_status: 'Active',
    property_type: 'Single Family',
    budget_min: '450000',
    budget_max: '600000',
    pre_approved: 'true',
    pre_approval_amount: '610000',
    pre_approval_expiry: '2026-08-15',
    desired_location: 'Highland Park, Wash Park',
    must_haves: '3+ beds, walkable, fenced yard',
    deal_breakers: 'No HOA over $300/mo',
    timeline: '1-3 months',
    referred_by: 'Past Client',
    preferred_contact: 'Text',
    closing_date: '',
    priority: 'High',
    notes: 'Wants to close before school year starts'
  }],
  requiredHeaders: ['name'],
  mapRow: (r) => {
    if (!r.name?.trim()) return null
    const preApproved = ['true', '1', 'yes', 'y'].includes(String(r.pre_approved || '').toLowerCase().trim())
    return {
      name: r.name.trim(),
      email: r.email?.trim() || null,
      phone: r.phone?.trim() || null,
      brokerage_name: r.brokerage_name?.trim() || null,
      client_type: pickOption(r.client_type, CLIENT_TYPES, 'Buyer'),
      transaction_status: pickOption(r.transaction_status || r.status, TRANSACTION_STATUSES, 'Active'),
      property_type: pickOption(r.property_type, PROPERTY_TYPES, '') || null,
      budget_min: r.budget_min ? toNumber(r.budget_min, 0) : null,
      budget_max: r.budget_max ? toNumber(r.budget_max, 0) : null,
      pre_approved: preApproved,
      pre_approval_amount: r.pre_approval_amount ? toNumber(r.pre_approval_amount, 0) : null,
      pre_approval_expiry: toDateOrNull(r.pre_approval_expiry),
      desired_location: r.desired_location?.trim() || null,
      must_haves: r.must_haves?.trim() || null,
      deal_breakers: r.deal_breakers?.trim() || null,
      timeline: pickOption(r.timeline, TIMELINE_OPTIONS, '') || null,
      referred_by: pickOption(r.referred_by, LEAD_SOURCES, '') || (r.referred_by?.trim() || null),
      preferred_contact: pickOption(r.preferred_contact, PREFERRED_CONTACT, '') || null,
      closing_date: toDateOrNull(r.closing_date),
      priority: pickOption(r.priority, PRIORITY_LEVELS, 'Medium'),
      notes: r.notes?.trim() || null
    }
  },
  validateRow: (r) => r.name ? null : 'Name is required'
}

// ---------- Listings (backed by `projects` table) ----------
export function listingImport(clients) {
  return {
    templateHeaders: [
      'name', 'property_address', 'city', 'state', 'zip',
      'mls_number', 'listing_type', 'property_type', 'status',
      'seller_name', 'list_price', 'sale_price',
      'commission_rate', 'listing_date', 'listing_expiry',
      'bedrooms', 'bathrooms', 'square_feet', 'year_built',
      'photos_link', 'virtual_tour_link', 'priority', 'notes'
    ],
    templateSample: [{
      name: '1234 Maple St — Wash Park',
      property_address: '1234 Maple St',
      city: 'Denver',
      state: 'CO',
      zip: '80210',
      mls_number: 'MLS-1029384',
      listing_type: 'Exclusive Right to Sell',
      property_type: 'Single Family',
      status: 'Active',
      seller_name: 'Pat Morgan',
      list_price: '725000',
      sale_price: '',
      commission_rate: '3.0',
      listing_date: '2026-05-01',
      listing_expiry: '2026-08-01',
      bedrooms: '4',
      bathrooms: '2.5',
      square_feet: '2400',
      year_built: '1998',
      photos_link: 'https://drive.google.com/…',
      virtual_tour_link: 'https://tour.example.com/…',
      priority: 'High',
      notes: 'Owner relocating for work'
    }],
    requiredHeaders: ['name'],
    mapRow: (r) => {
      if (!r.name?.trim()) return null
      const seller = findClient(clients, r.seller_name, r.client_name)
      return {
        name: r.name.trim(),
        seller_id: seller?.id || null,
        client_id: seller?.id || null,
        property_address: r.property_address?.trim() || null,
        city: r.city?.trim() || null,
        state: r.state?.trim() || null,
        zip: r.zip?.trim() || null,
        mls_number: r.mls_number?.trim() || null,
        listing_type: pickOption(r.listing_type, LISTING_TYPES, 'Exclusive Right to Sell'),
        property_type: pickOption(r.property_type, PROPERTY_TYPES, '') || null,
        status: pickOption(r.status, LISTING_STATUSES, 'Active'),
        list_price: r.list_price ? toNumber(r.list_price, 0) : null,
        sale_price: r.sale_price ? toNumber(r.sale_price, 0) : null,
        commission_rate: r.commission_rate ? toNumber(r.commission_rate, 3) : 3.0,
        listing_date: toDateOrNull(r.listing_date),
        listing_expiry: toDateOrNull(r.listing_expiry),
        bedrooms: r.bedrooms ? Math.round(toNumber(r.bedrooms, 0)) : null,
        bathrooms: r.bathrooms ? toNumber(r.bathrooms, 0) : null,
        square_feet: r.square_feet ? Math.round(toNumber(r.square_feet, 0)) : null,
        year_built: r.year_built ? Math.round(toNumber(r.year_built, 0)) : null,
        photos_link: r.photos_link?.trim() || null,
        virtual_tour_link: r.virtual_tour_link?.trim() || null,
        priority: pickOption(r.priority, PRIORITY_LEVELS, 'Medium'),
        notes: r.notes?.trim() || null
      }
    },
    validateRow: (r) => r.name ? null : 'Name is required'
  }
}

// ---------- Commissions (backed by `invoices` table) ----------
export function commissionImport(clients) {
  return {
    templateHeaders: [
      'title', 'invoice_number', 'client_name',
      'status', 'closing_date', 'invoice_date',
      'sale_price', 'commission_rate', 'gross_commission',
      'brokerage_split_percent', 'net_commission',
      'payment_method', 'notes'
    ],
    templateSample: [{
      title: '1234 Maple St — Listing Side',
      invoice_number: 'COM-1001',
      client_name: 'Pat Morgan',
      status: 'Expected',
      closing_date: '2026-06-30',
      invoice_date: '',
      sale_price: '720000',
      commission_rate: '3.0',
      gross_commission: '21600',
      brokerage_split_percent: '70',
      net_commission: '15120',
      payment_method: 'Wire',
      notes: 'Listing side, no concessions'
    }],
    requiredHeaders: ['client_name'],
    mapRow: (r) => {
      const client = findClient(clients, r.client_name)
      if (!client) return null
      const salePrice = r.sale_price ? toNumber(r.sale_price, 0) : null
      const rate = r.commission_rate ? toNumber(r.commission_rate, 0) : null
      const grossExplicit = r.gross_commission ? toNumber(r.gross_commission, 0) : null
      const grossCalc = salePrice && rate ? Math.round(salePrice * (rate / 100) * 100) / 100 : null
      const gross = grossExplicit ?? grossCalc
      const split = r.brokerage_split_percent ? toNumber(r.brokerage_split_percent, 0) : null
      const netExplicit = r.net_commission ? toNumber(r.net_commission, 0) : null
      const netCalc = gross != null && split != null ? Math.round(gross * (split / 100) * 100) / 100 : null
      const net = netExplicit ?? netCalc
      return {
        invoice_number: r.invoice_number?.trim() || `COM-${Date.now().toString().slice(-6)}`,
        title: r.title?.trim() || null,
        client_id: client.id,
        status: pickOption(r.status, COMMISSION_STATUSES, 'Expected'),
        closing_date: toDateOrNull(r.closing_date),
        invoice_date: toDateOrNull(r.invoice_date),
        sale_price: salePrice,
        commission_rate: rate,
        gross_commission: gross,
        brokerage_split_percent: split,
        net_commission: net,
        amount: net ?? gross ?? 0,
        payment_method: r.payment_method?.trim() || null,
        notes: r.notes?.trim() || null
      }
    },
    validateRow: (r) => r.client_id ? null : 'No client matched — add the client first or check the spelling'
  }
}

// ---------- Tasks ----------
export function taskImport(clients, listings) {
  return {
    templateHeaders: [
      'name', 'client_name', 'listing_name',
      'status', 'priority',
      'due_date', 'notes'
    ],
    templateSample: [{
      name: 'Send disclosure package to seller',
      client_name: 'Pat Morgan',
      listing_name: '1234 Maple St — Wash Park',
      status: 'To Do',
      priority: 'High',
      due_date: '2026-05-25',
      notes: 'Include radon, lead, and seller property disclosure'
    }],
    requiredHeaders: ['name'],
    mapRow: (r) => {
      if (!r.name?.trim()) return null
      const client = findClient(clients, r.client_name)
      const listing = findListing(listings, r.listing_name || r.project_name, client?.id)
      const status = resolveTaskStatus(r.status)
      return {
        name: r.name.trim(),
        client_id: client?.id || null,
        project_id: listing?.id || null,
        status,
        priority: pickOption(r.priority, PRIORITY_LEVELS, 'Medium'),
        due_date: toDateOrNull(r.due_date),
        notes: r.notes?.trim() || null,
        completed: status === 'Done'
      }
    },
    validateRow: (r) => r.name ? null : 'Name is required'
  }
}

// ---------- Follow-ups ----------
export function followUpImport(clients) {
  return {
    templateHeaders: [
      'title', 'client_name', 'type', 'status',
      'follow_up_date', 'channel',
      'property_interest', 'notes', 'outcome'
    ],
    templateSample: [{
      title: 'Showing feedback — 1234 Maple St',
      client_name: 'Riley Carter',
      type: 'Showing Feedback',
      status: 'Scheduled',
      follow_up_date: '2026-05-22',
      channel: 'Phone Call',
      property_interest: '1234 Maple St',
      notes: 'Liked layout, concerned about street noise',
      outcome: ''
    }],
    requiredHeaders: ['title', 'client_name'],
    mapRow: (r) => {
      if (!r.title?.trim()) return null
      const client = findClient(clients, r.client_name)
      if (!client) return null
      const type = pickOption(r.type, FOLLOW_UP_TYPES, '') || (r.type?.trim() || 'General Check-In')
      const channel = pickOption(r.channel || r.communication_platform, FOLLOW_UP_CHANNELS, '') || (r.channel?.trim() || 'Phone Call')
      return {
        title: r.title.trim(),
        client_id: client.id,
        type,
        follow_up_type: type,
        status: resolveFollowUpStatus(r.status),
        follow_up_date: toDateOrNull(r.follow_up_date || r.date),
        channel,
        property_interest: r.property_interest?.trim() || null,
        notes: r.notes?.trim() || null,
        outcome: r.outcome?.trim() || null
      }
    },
    validateRow: (r) => {
      if (!r.title) return 'Title is required'
      if (!r.client_id) return 'No client matched — add the client first or check the spelling'
      return null
    }
  }
}
