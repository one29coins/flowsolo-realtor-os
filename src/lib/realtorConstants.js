// Shared option lists for The Realtor OS forms, imports, and filters.
// Edit one place — all surfaces pick it up.

export const CLIENT_TYPES = [
  'Buyer',
  'Seller',
  'Both',
  'Past Client',
  'Referral Source'
]

export const TRANSACTION_STATUSES = [
  'Active',
  'Under Contract',
  'Closed',
  'Paused',
  'Lost'
]

export const PROPERTY_TYPES = [
  'Single Family',
  'Condo',
  'Townhouse',
  'Multi-Family',
  'Land',
  'Commercial',
  'Investment',
  'Any'
]

export const LISTING_TYPES = [
  'Exclusive Right to Sell',
  'Exclusive Agency',
  'Open Listing',
  'Buyer Agency',
  'Dual Agency'
]

export const LISTING_STATUSES = [
  'Coming Soon',
  'Active',
  'Under Contract',
  'Pending',
  'Sold',
  'Expired',
  'Withdrawn',
  'Price Reduced'
]

export const LEAD_STAGES = [
  'New Lead',
  'Contacted',
  'Qualified',
  'Showing',
  'Offer Stage',
  'Under Contract',
  'Closed'
]

export const LEAD_SOURCES = [
  'Zillow',
  'Realtor.com',
  'Open House',
  'Referral',
  'Social Media',
  'Cold Call',
  'Website',
  'Sign Call',
  'Sphere of Influence',
  'Past Client',
  'Other'
]

export const TIMELINE_OPTIONS = [
  'ASAP',
  '1-3 months',
  '3-6 months',
  '6-12 months',
  'Just Looking'
]

export const PREFERRED_CONTACT = [
  'Phone',
  'Text',
  'Email',
  'WhatsApp',
  'Other'
]

export const FOLLOW_UP_TYPES = [
  'Initial Inquiry Response',
  'Buyer Consultation',
  'Seller Listing Presentation',
  'Showing Feedback',
  'Offer Update',
  'Under Contract Update',
  'Closing Prep Call',
  'Post-Close Thank You',
  'Sphere of Influence Touch',
  'Anniversary / Holiday Touch',
  'Price Reduction Discussion',
  'Listing Renewal Conversation',
  'General Check-In'
]

export const FOLLOW_UP_CHANNELS = [
  'Phone Call',
  'Text Message',
  'Email',
  'In-Person Meeting',
  'Video Call',
  'WhatsApp',
  'Other'
]

export const DOCUMENT_CATEGORIES = [
  'Buyer Documents',
  'Seller Documents',
  'Listing Templates',
  'Offer Templates',
  'Disclosures',
  'Inspection',
  'Title and Closing',
  'Marketing',
  'General',
  'Other'
]

export const DOCUMENT_TYPES = [
  'Template',
  'Form',
  'Checklist',
  'Agreement',
  'Disclosure',
  'Reference',
  'Marketing',
  'Other'
]

export const TRANSACTION_TYPES = [
  'Sale',
  'Purchase',
  'Lease',
  'Other'
]

export const SPECIALTIES = [
  'Residential Sales',
  'Luxury',
  'First-Time Buyers',
  'Investment Properties',
  'Commercial',
  'Land',
  'Relocation',
  'Short Sales',
  'New Construction',
  'Rentals'
]

export const MARKET_TREND_OPTIONS = [
  "Seller's Market",
  'Balanced Market',
  "Buyer's Market"
]

// Used for showing interest ratings (1–5)
export const INTEREST_LEVELS = [
  { value: 1, label: 'Not interested' },
  { value: 2, label: 'Minor interest' },
  { value: 3, label: 'Possible' },
  { value: 4, label: 'Interested' },
  { value: 5, label: 'Ready to offer' }
]

// Commission / invoice statuses surfaced in the Commission Hub
export const COMMISSION_STATUSES = [
  'Expected',
  'Under Contract',
  'Closing Scheduled',
  'Paid',
  'Split',
  'Cancelled'
]

// Generic priority shared across tasks, leads, listings
export const PRIORITY_LEVELS = ['High', 'Medium', 'Low']

// Generic task statuses (matches Tasks board)
export const TASK_STATUSES = ['To Do', 'In Progress', 'Waiting', 'Done']

// Follow-up statuses (mirrors task-style flow)
export const FOLLOW_UP_STATUSES = ['Scheduled', 'Done', 'Skipped']
